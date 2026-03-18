import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AdministrativeLevel as AdministrativeLevelEntity } from './entities/administrative-level.entity';
import { AdministrativeLevelTranslation } from './entities/administrative-level-translation.entity';
import { CreateAdministrativeLevelDto } from './dto/create-administrative-level.dto';
import { UpdateAdministrativeLevelDto } from './dto/update-administrative-level.dto';
import { QueryAdministrativeLevelDto } from './dto/query-administrative-level.dto';
import { AdministrativeLevelResponseDto } from './dto/administrative-level-response.dto';
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
export class AdministrativeLevelsService {
  private readonly logger = new Logger(AdministrativeLevelsService.name);

  constructor(
    @InjectRepository(AdministrativeLevelEntity)
    private readonly administrativeLevelRepository: Repository<AdministrativeLevelEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateAdministrativeLevelDto,
  ): Promise<AdministrativeLevelResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const level = queryRunner.manager.create(AdministrativeLevelEntity, {
        isActive: dto.isActive,
      });
      const savedLevel = await queryRunner.manager.save(level);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(AdministrativeLevelTranslation, {
          ...t,
          administrativeLevelId: savedLevel.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'administrative-level',
        resourceId: savedLevel.id,
        after: { ...savedLevel, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(savedLevel, translations, 'en', true);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create administrative level', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryAdministrativeLevelDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: AdministrativeLevelResponseDto[]; total: number }> {
    const [entities, total] =
      await this.administrativeLevelRepository.findAndCount({
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
          e.translations as unknown as AdministrativeLevelTranslation[],
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
  ): Promise<AdministrativeLevelResponseDto> {
    const level = await this.administrativeLevelRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!level) {
      throw new EntityNotFoundException('Administrative Level', id);
    }

    return this.toResponseDto(
      level,
      level.translations as unknown as AdministrativeLevelTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(
    id: string,
    dto: UpdateAdministrativeLevelDto,
  ): Promise<AdministrativeLevelResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const level = await this.administrativeLevelRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!level) {
      throw new EntityNotFoundException('Administrative Level', id);
    }

    const before = {
      ...level,
      translations: [...level.translations],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        level.isActive = dto.isActive;
      }
      await queryRunner.manager.save(level);

      if (dto.translations) {
        await queryRunner.manager.delete(AdministrativeLevelTranslation, {
          administrativeLevelId: id,
        });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(AdministrativeLevelTranslation, {
            ...t,
            administrativeLevelId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        level.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'administrative-level',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: level as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        level,
        level.translations as unknown as AdministrativeLevelTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update administrative level', {
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
    const level = await this.administrativeLevelRepository.findOne({
      where: { id },
    });
    if (!level) {
      throw new EntityNotFoundException('Administrative Level', id);
    }

    await this.administrativeLevelRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'administrative-level',
      resourceId: id,
      before: level as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: AdministrativeLevelEntity,
    translations: AdministrativeLevelTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): AdministrativeLevelResponseDto {
    const response: AdministrativeLevelResponseDto = {
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
