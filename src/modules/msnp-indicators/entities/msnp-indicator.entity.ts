import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('msnp_indicators')
export class MsnpIndicator extends BaseEntity {
  @Column({ type: 'jsonb' })
  code: LocalizedField;

  @Column({ type: 'jsonb' })
  name: LocalizedField;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
