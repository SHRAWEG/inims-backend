import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { AgeGroup as AgeGroupEntity } from './entities/age-group.entity';
import { AgeGroupTranslation } from './entities/age-group-translation.entity';
import { CreateAgeGroupDto } from './dto/create-age-group.dto';
import { UpdateAgeGroupDto } from './dto/update-age-group.dto';
import { QueryAgeGroupDto } from './dto/query-age-group.dto';
import { AgeGroupResponseDto } from './dto/age-group-response.dto';
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
export class AgeGroupsService {
  private readonly logger = new Logger(AgeGroupsService.name);

  constructor(
    @InjectRepository(AgeGroupEntity)
    private readonly ageGroupRepository: Repository<AgeGroupEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateAgeGroupDto): Promise<AgeGroupResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ageGroup = queryRunner.manager.create(AgeGroupEntity, {
        isActive: dto.isActive,
      });
      const savedAgeGroup = await queryRunner.manager.save(ageGroup);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(AgeGroupTranslation, {
          ...t,
          ageGroupId: savedAgeGroup.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'age-group',
        resourceId: savedAgeGroup.id,
        after: { ...savedAgeGroup, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(
        savedAgeGroup,
        translations as unknown as AgeGroupTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create age group', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryAgeGroupDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: AgeGroupResponseDto[]; total: number }> {
    const where: FindOptionsWhere<AgeGroupEntity> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [entities, total] = await this.ageGroupRepository.findAndCount({
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
          e.translations as unknown as AgeGroupTranslation[],
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
  ): Promise<AgeGroupResponseDto> {
    const ageGroup = await this.ageGroupRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!ageGroup) {
      throw new EntityNotFoundException('Age Group', id);
    }

    return this.toResponseDto(
      ageGroup,
      ageGroup.translations as unknown as AgeGroupTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(
    id: string,
    dto: UpdateAgeGroupDto,
  ): Promise<AgeGroupResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const ageGroup = await this.ageGroupRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!ageGroup) {
      throw new EntityNotFoundException('Age Group', id);
    }

    const before = {
      ...ageGroup,
      translations: [
        ...(ageGroup.translations as unknown as AgeGroupTranslation[]),
      ],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        ageGroup.isActive = dto.isActive;
      }
      await queryRunner.manager.save(ageGroup);

      if (dto.translations) {
        await queryRunner.manager.delete(AgeGroupTranslation, {
          ageGroupId: id,
        });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(AgeGroupTranslation, {
            ...t,
            ageGroupId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        ageGroup.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'age-group',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: ageGroup as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        ageGroup,
        ageGroup.translations as unknown as AgeGroupTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update age group', {
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
    const ageGroup = await this.ageGroupRepository.findOne({ where: { id } });
    if (!ageGroup) {
      throw new EntityNotFoundException('Age Group', id);
    }

    await this.ageGroupRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'age-group',
      resourceId: id,
      before: ageGroup as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: AgeGroupEntity,
    translations: AgeGroupTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): AgeGroupResponseDto {
    const response: AgeGroupResponseDto = {
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
