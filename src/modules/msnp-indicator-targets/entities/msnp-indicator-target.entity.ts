import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorConfiguration } from '../../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { MsnpIndicator } from '../../msnp-indicators/entities/msnp-indicator.entity';

@Entity('msnp_indicator_targets')
@Unique(['indicatorConfigId', 'fiscalYearId'])
export class MsnpIndicatorTarget extends BaseEntity {
  @Column({ name: 'indicator_config_id', type: 'uuid' })
  indicatorConfigId: string;

  @Column({ name: 'fiscal_year_id', type: 'uuid' })
  fiscalYearId: string;

  @Column({ name: 'indicator_id', type: 'uuid' })
  indicatorId: string;

  @Column({ name: 'target_value', type: 'varchar' })
  targetValue: string;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @ManyToOne(() => MsnpIndicatorConfiguration)
  @JoinColumn({ name: 'indicator_config_id' })
  indicatorConfig: MsnpIndicatorConfiguration;

  @ManyToOne(() => FiscalYear)
  @JoinColumn({ name: 'fiscal_year_id' })
  fiscalYear: FiscalYear;

  @ManyToOne(() => MsnpIndicator)
  @JoinColumn({ name: 'indicator_id' })
  indicator: MsnpIndicator;
}
