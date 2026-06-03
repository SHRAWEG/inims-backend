import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorConfiguration } from '../../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { User } from '../../users/entities/user.entity';
import { MsnpIndicator } from '../../msnp-indicators/entities/msnp-indicator.entity';
import { MsnpIndicatorDisaggregationData } from './msnp-indicator-disaggregation-data.entity';

@Entity('msnp_indicator_data')
@Unique(['indicatorConfigId', 'fiscalYearId'])
export class MsnpIndicatorData extends BaseEntity {
  @Column({ name: 'indicator_config_id', type: 'uuid' })
  indicatorConfigId: string;

  @Column({ name: 'fiscal_year_id', type: 'uuid' })
  fiscalYearId: string;

  @Column({ name: 'indicator_id', type: 'uuid' })
  indicatorId: string;

  @Column({ type: 'varchar' })
  value: string;

  @Column({ name: 'data_source', type: 'varchar', nullable: true })
  dataSource: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'submitted_by', type: 'uuid' })
  submittedBy: string;

  @ManyToOne(() => MsnpIndicatorConfiguration)
  @JoinColumn({ name: 'indicator_config_id' })
  indicatorConfig: MsnpIndicatorConfiguration;

  @ManyToOne(() => FiscalYear)
  @JoinColumn({ name: 'fiscal_year_id' })
  fiscalYear: FiscalYear;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submittedByUser: User;

  @ManyToOne(() => MsnpIndicator)
  @JoinColumn({ name: 'indicator_id' })
  indicator: MsnpIndicator;

  @OneToMany(
    () => MsnpIndicatorDisaggregationData,
    (disagg) => disagg.msnpIndicatorData,
    { cascade: true },
  )
  disaggregationData: MsnpIndicatorDisaggregationData[];
}
