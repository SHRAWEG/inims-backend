import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DisaggregationType } from '../../disaggregation-types/entities/disaggregation-type.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('disaggregation_options')
export class DisaggregationOption extends BaseEntity {
  @Index()
  @Column({ name: 'disaggregation_type_id', type: 'uuid' })
  disaggregationTypeId: string;

  @Column({ type: 'jsonb' })
  name: LocalizedField;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder: number | null;

  @ManyToOne(() => DisaggregationType, (type) => type.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'disaggregation_type_id' })
  disaggregationType: DisaggregationType;
}
