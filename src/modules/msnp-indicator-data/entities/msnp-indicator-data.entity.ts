import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicatorConfiguration } from '../../msnp-indicator-configurations/entities/msnp-indicator-configuration.entity';
import { FiscalYear } from '../../fiscal-years/entities/fiscal-year.entity';
import { User } from '../../users/entities/user.entity';

@Entity('msnp_indicator_data')
@Unique(['indicatorConfigId', 'fiscalYearId'])
export class MsnpIndicatorData extends BaseEntity {
  @Column({ name: 'indicator_config_id', type: 'uuid' })
  indicatorConfigId: string;

  @Column({ name: 'fiscal_year_id', type: 'uuid' })
  fiscalYearId: string;

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
}
