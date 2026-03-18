import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('genders')
export class Gender extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  name: LocalizedField;
}
