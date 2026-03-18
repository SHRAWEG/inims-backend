import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import { Gender as GenderEntity } from './entities/gender.entity';
import { GenderTranslation } from './entities/gender-translation.entity';
import { CreateGenderDto } from './dto/create-gender.dto';
import { UpdateGenderDto } from './dto/update-gender.dto';
import { QueryGenderDto } from './dto/query-gender.dto';
import { GenderResponseDto } from './dto/gender-response.dto';
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
export class GendersService {
  private readonly logger = new Logger(GendersService.name);

  constructor(
    @InjectRepository(GenderEntity)
    private readonly genderRepository: Repository<GenderEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateGenderDto): Promise<GenderResponseDto> {
    validateTranslations(dto.translations);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const gender = queryRunner.manager.create(GenderEntity, {
        isActive: dto.isActive,
      });
      const savedGender = await queryRunner.manager.save(gender);

      const translations = dto.translations.map((t) =>
        queryRunner.manager.create(GenderTranslation, {
          ...t,
          genderId: savedGender.id,
        }),
      );
      await queryRunner.manager.save(translations);

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.CREATE,
        resource: 'gender',
        resourceId: savedGender.id,
        after: { ...savedGender, translations } as unknown as Record<
          string,
          unknown
        >,
      });

      return this.toResponseDto(
        savedGender,
        translations as unknown as GenderTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: QueryGenderDto,
    locale: SupportedLocale,
    withTranslations: boolean,
  ): Promise<{ data: GenderResponseDto[]; total: number }> {
    const where: FindOptionsWhere<GenderEntity> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [entities, total] = await this.genderRepository.findAndCount({
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
          e.translations as unknown as GenderTranslation[],
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
  ): Promise<GenderResponseDto> {
    const gender = await this.genderRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!gender) {
      throw new EntityNotFoundException('Gender', id);
    }

    return this.toResponseDto(
      gender,
      gender.translations as unknown as GenderTranslation[],
      locale,
      withTranslations,
    );
  }

  async update(id: string, dto: UpdateGenderDto): Promise<GenderResponseDto> {
    if (dto.translations) {
      validateTranslations(dto.translations);
    }

    const gender = await this.genderRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!gender) {
      throw new EntityNotFoundException('Gender', id);
    }

    const before = {
      ...gender,
      translations: [
        ...(gender.translations as unknown as GenderTranslation[]),
      ],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.isActive !== undefined) {
        gender.isActive = dto.isActive;
      }
      await queryRunner.manager.save(gender);

      if (dto.translations) {
        await queryRunner.manager.delete(GenderTranslation, { genderId: id });
        const translations = dto.translations.map((t) =>
          queryRunner.manager.create(GenderTranslation, {
            ...t,
            genderId: id,
          }),
        );
        await queryRunner.manager.save(translations);
        gender.translations = translations;
      }

      await queryRunner.commitTransaction();

      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: 'gender',
        resourceId: id,
        before: before as unknown as Record<string, unknown>,
        after: gender as unknown as Record<string, unknown>,
      });

      return this.toResponseDto(
        gender,
        gender.translations as unknown as GenderTranslation[],
        'en',
        true,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDbError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const gender = await this.genderRepository.findOne({ where: { id } });
    if (!gender) {
      throw new EntityNotFoundException('Gender', id);
    }

    await this.genderRepository.softDelete(id);

    await this.auditLogService.log({
      action: AuditAction.SOFT_DELETE,
      resource: 'gender',
      resourceId: id,
      before: gender as unknown as Record<string, unknown>,
    });
  }

  private toResponseDto(
    entity: GenderEntity,
    translations: GenderTranslation[],
    locale: SupportedLocale,
    withTranslations: boolean,
  ): GenderResponseDto {
    const response: GenderResponseDto = {
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
    throw error;
  }
}
