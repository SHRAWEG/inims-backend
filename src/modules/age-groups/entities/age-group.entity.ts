import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AgeGroupTranslation } from './age-group-translation.entity';

@Entity('age_groups')
export class AgeGroup extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => AgeGroupTranslation,
    (translation: AgeGroupTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: AgeGroupTranslation[];
}
