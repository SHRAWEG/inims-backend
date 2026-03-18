import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('frequencies')
export class Frequency extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  name: LocalizedField;
}
