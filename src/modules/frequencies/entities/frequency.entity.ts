import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FrequencyTranslation } from './frequency-translation.entity';

@Entity('frequencies')
export class Frequency extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => FrequencyTranslation,
    (translation: FrequencyTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: FrequencyTranslation[];
}
