import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorTranslation } from './msnp-indicator-translation.entity';

@Entity('msnp_indicators')
export class MsnpIndicator extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(
    () => MsnpIndicatorTranslation,
    (translation: MsnpIndicatorTranslation) => translation.parent,
    {
      cascade: true,
    },
  )
  translations: MsnpIndicatorTranslation[];
}
