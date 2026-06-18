import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

export enum TypeCategory {
  IMPACT = 'Impact',
  OUTCOME = 'Outcome',
  OUTPUT = 'Output',
}

@Entity('types')
export class Type extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: TypeCategory,
    default: TypeCategory.OUTCOME,
  })
  category: TypeCategory;

  @Column({ type: 'jsonb' })
  name: LocalizedField;

  @Column({ type: 'jsonb' })
  description: LocalizedField;
}
