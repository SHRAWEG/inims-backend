import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorConfiguration } from './msnp-indicator-configuration.entity';
import { DisaggregationType } from '../../disaggregation-types/entities/disaggregation-type.entity';
import { MsnpIndicatorDisaggregationOption } from './msnp-indicator-disaggregation-option.entity';

@Entity('msnp_indicator_disaggregations')
export class MsnpIndicatorDisaggregation extends BaseEntity {
  @Column({ name: 'configuration_id', type: 'uuid' })
  configurationId: string;

  @Column({ name: 'disaggregation_type_id', type: 'uuid' })
  disaggregationTypeId: string;

  @ManyToOne(
    () => MsnpIndicatorConfiguration,
    (config) => config.disaggregations,
  )
  @JoinColumn({ name: 'configuration_id' })
  configuration: MsnpIndicatorConfiguration;

  @ManyToOne(() => DisaggregationType)
  @JoinColumn({ name: 'disaggregation_type_id' })
  disaggregationType: DisaggregationType;

  @OneToMany(
    () => MsnpIndicatorDisaggregationOption,
    (option) => option.disaggregation,
    { cascade: true },
  )
  options: MsnpIndicatorDisaggregationOption[];
}
