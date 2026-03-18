import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sector } from './entities/sector.entity';
import { SectorTranslation } from './entities/sector-translation.entity';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { QuerySectorDto } from './dto/query-sector.dto';
import { SectorResponseDto } from './dto/sector-response.dto';
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
export class SectorsService {
  private readonly logger = new Logger(SectorsService.name);

  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSectorDto): Promise<SectorResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sector = queryRunner.manager.create(Sector, {
        isActive: dto.isActive,
      });
      const savedSector = await queryRunner.manager.save(sector);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(SectorTranslation, {
          ...t,
          sectorId: savedSector.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'sector',
        resourceId: savedSector.id,
        after: { ...savedSector, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(savedSector, translations, 'en', true);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to create sector', {
        error: err.message,
        stack: err.stack,
      });
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QuerySectorDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: SectorResponseDto[]; total: number }> {
    const [entities, total] = await this.sectorRepository.findAndCount({
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
          e.translations as unknown as SectorTranslation[],
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
  ): Promise<SectorResponseDto> {
    const sector = await this.sectorRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!sector) {
      throw new EntityNotFoundException('Sector', id);
    }

    return this.toResponseDto(
      sector,
      sector.translations as unknown as SectorTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(id: string, dto: UpdateSectorDto): Promise<SectorResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const sector = await this.sectorRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!sector) {
      throw new EntityNotFoundException('Sector', id);
    }

    const before = { ...sector, translations: [...sector.translations] };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        sector.isActive = dto.isActive;
      }
      await queryRunner.manager.save(sector);

      if (dto.translations) {
        // Simple approach: delete existing and recreate
        await queryRunner.manager.delete(SectorTranslation, { sectorId: id });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(SectorTranslation, {
            ...t,
            sectorId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        sector.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'sector',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: sector as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        sector,
        sector.translations as unknown as SectorTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error('Failed to update sector', {
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
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) {
      throw new EntityNotFoundException('Sector', id);
    }

    await this.sectorRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'sector',
      resourceId: id,
      before: sector as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: Sector,
    translations: SectorTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): SectorResponseDto {
    const response: SectorResponseDto = {
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
