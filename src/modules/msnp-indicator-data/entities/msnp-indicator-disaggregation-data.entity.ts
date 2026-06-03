import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorData } from './msnp-indicator-data.entity';
import { DisaggregationOption } from '../../disaggregation-options/entities/disaggregation-option.entity';

@Entity('msnp_indicator_disaggregation_data')
export class MsnpIndicatorDisaggregationData extends BaseEntity {
  @Column({ name: 'msnp_indicator_data_id', type: 'uuid' })
  msnpIndicatorDataId: string;

  @Column({ name: 'disaggregation_option_id', type: 'uuid' })
  disaggregationOptionId: string;

  @Column({ type: 'varchar' })
  value: string;

  @ManyToOne(
    () => MsnpIndicatorData,
    (indicatorData) => indicatorData.disaggregationData,
  )
  @JoinColumn({ name: 'msnp_indicator_data_id' })
  msnpIndicatorData: MsnpIndicatorData;

  @ManyToOne(() => DisaggregationOption)
  @JoinColumn({ name: 'disaggregation_option_id' })
  disaggregationOption: DisaggregationOption;
}
