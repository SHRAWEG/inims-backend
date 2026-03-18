import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Frequency as FrequencyEntity } from './entities/frequency.entity';
import { FrequencyTranslation } from './entities/frequency-translation.entity';
import { CreateFrequencyDto } from './dto/create-frequency.dto';
import { UpdateFrequencyDto } from './dto/update-frequency.dto';
import { QueryFrequencyDto } from './dto/query-frequency.dto';
import { FrequencyResponseDto } from './dto/frequency-response.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../../common/enums/audit-action.enum';
import {
  validateTranslations,
  resolveTranslation,
} from '../../common/utils/translation.util';
import { SupportedLocale } from '../../common/types/i18n.type';
import { BusinessLogicException } from '../../common/exceptions/business-logic.exception';
import { EntityNotFoundException } from '../../common/exceptions/not-found.exception';

@Injectable()
export class FrequenciesService {
  private readonly logger = new Logger(FrequenciesService.name);

  constructor(
    @InjectRepository(FrequencyEntity)
    private readonly frequencyRepository: Repository<FrequencyEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateFrequencyDto): Promise<FrequencyResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const frequency = queryRunner.manager.create(FrequencyEntity, {
        isActive: dto.isActive,
      });
      const savedFrequency = await queryRunner.manager.save(frequency);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(FrequencyTranslation, {
          ...t,
          frequencyId: savedFrequency.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'frequency',
        resourceId: savedFrequency.id,
        after: { ...savedFrequency, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(savedFrequency, translations, 'en', true);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create frequency', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryFrequencyDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: FrequencyResponseDto[]; total: number }> {
    const [entities, total] = await this.frequencyRepository.findAndCount({
      where: {
        isActive: query.isActive,
      },
      relations: ['translations'],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map((e) =>
        this.toResponseDto(
          e,
          e.translations as unknown as FrequencyTranslation[],
          locale,
          withTranslations,
        ),
      ),
      total,
    };
  }

  async findOne(
    id: string,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<FrequencyResponseDto> {
    const frequency = await this.frequencyRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!frequency) {
      throw new EntityNotFoundException('Frequency', id);
    }

    return this.toResponseDto(
      frequency,
      frequency.translations as unknown as FrequencyTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(
    id: string,
    dto: UpdateFrequencyDto,
  ): Promise<FrequencyResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const frequency = await this.frequencyRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!frequency) {
      throw new EntityNotFoundException('Frequency', id);
    }

    const before = {
      ...frequency,
      translations: [
        ...(frequency.translations as unknown as FrequencyTranslation[]),
      ],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        frequency.isActive = dto.isActive;
      }
      await queryRunner.manager.save(frequency);

      if (dto.translations) {
        await queryRunner.manager.delete(FrequencyTranslation, {
          frequencyId: id,
        });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(FrequencyTranslation, {
            ...t,
            frequencyId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        frequency.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'frequency',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: frequency as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        frequency,
        frequency.translations as unknown as FrequencyTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update frequency', {
        error: err.message,
        stack: err.stack,
        id,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const frequency = await this.frequencyRepository.findOne({
      where: { id },
    });
    if (!frequency) {
      throw new EntityNotFoundException('Frequency', id);
    }

    await this.frequencyRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'frequency',
      resourceId: id,
      before: frequency as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: FrequencyEntity,
    translations: FrequencyTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): FrequencyResponseDto {
    const response: FrequencyResponseDto = {
      id: entity.id,
      isActive: entity.isActive,
    };

    if (withTranslations) {
      response.translations = translations.map((t) => ({
        locale: t.locale,
        name: t.name,
      }));
    } else {
      const translation = resolveTranslation(translations, locale);
      response.name = translation?.name;
    }

    return response;
  }

  private handleDbError(error: unknown): never {
    const err = error as { code?: string; detail?: string };
    if (err?.code === '23505') {
      throw new BusinessLogicException(`Duplicate entry: ${err.detail}`);
    }
    if (err?.code === '23503') {
      throw new BusinessLogicException('Referenced record does not exist');
    }
    throw error;
  }
}
