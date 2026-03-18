import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Type as TypeEntity } from './entities/type.entity';
import { TypeTranslation } from './entities/type-translation.entity';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { QueryTypeDto } from './dto/query-type.dto';
import { TypeResponseDto } from './dto/type-response.dto';
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
export class TypesService {
  private readonly logger = new Logger(TypesService.name);

  constructor(
    @InjectRepository(TypeEntity)
    private readonly typeRepository: Repository<TypeEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTypeDto): Promise<TypeResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const typeRecord = queryRunner.manager.create(TypeEntity, {
        isActive: dto.isActive,
      });
      const savedType = await queryRunner.manager.save(typeRecord);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(TypeTranslation, {
          ...t,
          typeId: savedType.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'type',
        resourceId: savedType.id,
        after: { ...savedType, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(savedType, translations, 'en', true);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create type', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryTypeDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: TypeResponseDto[]; total: number }> {
    const [entities, total] = await this.typeRepository.findAndCount({
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
          e.translations as unknown as TypeTranslation[],
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
  ): Promise<TypeResponseDto> {
    const typeRecord = await this.typeRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!typeRecord) {
      throw new EntityNotFoundException('Type', id);
    }

    return this.toResponseDto(
      typeRecord,
      typeRecord.translations as unknown as TypeTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(id: string, dto: UpdateTypeDto): Promise<TypeResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const typeRecord = await this.typeRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!typeRecord) {
      throw new EntityNotFoundException('Type', id);
    }

    const before = {
      ...typeRecord,
      translations: [...typeRecord.translations],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        typeRecord.isActive = dto.isActive;
      }
      await queryRunner.manager.save(typeRecord);

      if (dto.translations) {
        await queryRunner.manager.delete(TypeTranslation, { typeId: id });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(TypeTranslation, {
            ...t,
            typeId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        typeRecord.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'type',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: typeRecord as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        typeRecord,
        typeRecord.translations as unknown as TypeTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update type', {
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
    const typeRecord = await this.typeRepository.findOne({ where: { id } });
    if (!typeRecord) {
      throw new EntityNotFoundException('Type', id);
    }

    await this.typeRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'type',
      resourceId: id,
      before: typeRecord as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: TypeEntity,
    translations: TypeTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): TypeResponseDto {
    const response: TypeResponseDto = {
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
