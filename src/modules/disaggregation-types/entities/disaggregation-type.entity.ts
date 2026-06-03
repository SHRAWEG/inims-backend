import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DisaggregationOption } from '../../disaggregation-options/entities/disaggregation-option.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('disaggregation_types')
export class DisaggregationType extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedField;

  @Column({ name: 'is_selective', type: 'boolean', default: false })
  isSelective: boolean;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder: number | null;

  @OneToMany(
    () => DisaggregationOption,
    (option) => option.disaggregationType,
    {
      cascade: true,
    },
  )
  options: DisaggregationOption[];
}
