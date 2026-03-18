import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AdministrativeLevelTranslation } from './administrative-level-translation.entity';

@Entity('administrative_levels')
export class AdministrativeLevel extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => AdministrativeLevelTranslation,
    (translation: AdministrativeLevelTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: AdministrativeLevelTranslation[];
}
