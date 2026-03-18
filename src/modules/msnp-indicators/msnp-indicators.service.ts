import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { MsnpIndicator as MsnpIndicatorEntity } from './entities/msnp-indicator.entity';
import { MsnpIndicatorTranslation } from './entities/msnp-indicator-translation.entity';
import { CreateMsnpIndicatorDto } from './dto/create-msnp-indicator.dto';
import { UpdateMsnpIndicatorDto } from './dto/update-msnp-indicator.dto';
import { QueryMsnpIndicatorDto } from './dto/query-msnp-indicator.dto';
import { MsnpIndicatorResponseDto } from './dto/msnp-indicator-response.dto';
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
export class MsnpIndicatorsService {
  private readonly logger = new Logger(MsnpIndicatorsService.name);

  constructor(
    @InjectRepository(MsnpIndicatorEntity)
    private readonly msnpIndicatorRepository: Repository<MsnpIndicatorEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateMsnpIndicatorDto): Promise<MsnpIndicatorResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const indicator = queryRunner.manager.create(MsnpIndicatorEntity, {
        code: dto.code,
        isActive: dto.isActive,
      });
      const savedIndicator = await queryRunner.manager.save(indicator);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(MsnpIndicatorTranslation, {
          ...t,
          msnpIndicatorId: savedIndicator.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'msnp-indicator',
        resourceId: savedIndicator.id,
        after: { ...savedIndicator, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(
        savedIndicator,
        translations as unknown as MsnpIndicatorTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create MSNP indicator', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryMsnpIndicatorDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: MsnpIndicatorResponseDto[]; total: number }> {
    const where: FindOptionsWhere<MsnpIndicatorEntity> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.code) where.code = query.code;

    const [entities, total] = await this.msnpIndicatorRepository.findAndCount({
      where,
      relations: ['translations'],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map((e) =>
        this.toResponseDto(
          e,
          e.translations as unknown as MsnpIndicatorTranslation[],
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
  ): Promise<MsnpIndicatorResponseDto> {
    const indicator = await this.msnpIndicatorRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!indicator) {
      throw new EntityNotFoundException('MSNP Indicator', id);
    }

    return this.toResponseDto(
      indicator,
      indicator.translations as unknown as MsnpIndicatorTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(
    id: string,
    dto: UpdateMsnpIndicatorDto,
  ): Promise<MsnpIndicatorResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const indicator = await this.msnpIndicatorRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!indicator) {
      throw new EntityNotFoundException('MSNP Indicator', id);
    }

    const before = {
      ...indicator,
      translations: [
        ...(indicator.translations as unknown as MsnpIndicatorTranslation[]),
      ],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.code !== undefined) {
        indicator.code = dto.code;
      }
      if (dto.isActive !== undefined) {
        indicator.isActive = dto.isActive;
      }
      await queryRunner.manager.save(indicator);

      if (dto.translations) {
        await queryRunner.manager.delete(MsnpIndicatorTranslation, {
          msnpIndicatorId: id,
        });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(MsnpIndicatorTranslation, {
            ...t,
            msnpIndicatorId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        indicator.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'msnp-indicator',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: indicator as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        indicator,
        indicator.translations as unknown as MsnpIndicatorTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update MSNP indicator', {
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
    const indicator = await this.msnpIndicatorRepository.findOne({
      where: { id },
    });
    if (!indicator) {
      throw new EntityNotFoundException('MSNP Indicator', id);
    }

    await this.msnpIndicatorRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'msnp-indicator',
      resourceId: id,
      before: indicator as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: MsnpIndicatorEntity,
    translations: MsnpIndicatorTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): MsnpIndicatorResponseDto {
    const response: MsnpIndicatorResponseDto = {
      id: entity.id,
      code: entity.code,
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
