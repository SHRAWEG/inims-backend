import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TypeTranslation } from './type-translation.entity';

@Entity('types')
export class Type extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => TypeTranslation,
    (translation: TypeTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: TypeTranslation[];
}
