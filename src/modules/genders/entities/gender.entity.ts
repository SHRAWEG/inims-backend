import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { GenderTranslation } from './gender-translation.entity';

@Entity('genders')
export class Gender extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => GenderTranslation,
    (translation: GenderTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: GenderTranslation[];
}
