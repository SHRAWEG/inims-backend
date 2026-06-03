import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorDisaggregation } from './msnp-indicator-disaggregation.entity';
import { DisaggregationOption } from '../../disaggregation-options/entities/disaggregation-option.entity';

@Entity('msnp_indicator_disaggregation_options')
export class MsnpIndicatorDisaggregationOption extends BaseEntity {
  @Column({ name: 'indicator_disaggregation_id', type: 'uuid' })
  indicatorDisaggregationId: string;

  @Column({ name: 'disaggregation_option_id', type: 'uuid' })
  disaggregationOptionId: string;

  @ManyToOne(
    () => MsnpIndicatorDisaggregation,
    (disaggregation) => disaggregation.options,
  )
  @JoinColumn({ name: 'indicator_disaggregation_id' })
  disaggregation: MsnpIndicatorDisaggregation;

  @ManyToOne(() => DisaggregationOption)
  @JoinColumn({ name: 'disaggregation_option_id' })
  disaggregationOption: DisaggregationOption;
}
