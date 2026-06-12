import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicator } from '../../msnp-indicators/entities/msnp-indicator.entity';
import { Sector } from '../../sectors/entities/sector.entity';
import { Type } from '../../types/entities/type.entity';
import { Role } from '../../roles/entities/role.entity';
import { MsnpIndicatorDisaggregation } from './msnp-indicator-disaggregation.entity';

@Entity('msnp_indicator_configurations')
export class MsnpIndicatorConfiguration extends BaseEntity {
  @Column({ name: 'indicator_id', type: 'uuid' })
  indicatorId: string;

  @Column({ name: 'sector_id', type: 'uuid', nullable: true })
  sectorId: string | null;

  @Column({ name: 'type_id', type: 'uuid', nullable: true })
  typeId: string | null;

  @Column({ name: 'role_id', type: 'uuid', nullable: true })
  roleId: string | null;

  @Column({ name: 'unit', type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'data_collection_method', type: 'varchar', nullable: true })
  dataCollectionMethod: string | null;

  @Column({ name: 'responsible_authority', type: 'varchar', nullable: true })
  responsibleAuthority: string | null;

  @Column({ name: 'supporting_authority', type: 'varchar', nullable: true })
  supportingAuthority: string | null;

  @Column({ name: 'frequency', type: 'varchar', nullable: true })
  frequency: string | null;

  @Column({
    name: 'report_preparation_and_utility',
    type: 'text',
    nullable: true,
  })
  reportPreparationAndUtility: string | null;

  @Column({
    name: 'dissemination_and_distribution',
    type: 'text',
    nullable: true,
  })
  disseminationAndDistribution: string | null;

  @Column({ name: 'is_m_and_e_framework', type: 'boolean', default: false })
  isMandEFramework: boolean;

  @Column({ name: 'is_result_framework', type: 'boolean', default: false })
  isResultFramework: boolean;

  @Column({ name: 'base_year', type: 'varchar', nullable: true })
  baseYear: string | null;

  @ManyToOne(() => MsnpIndicator)
  @JoinColumn({ name: 'indicator_id' })
  indicator: MsnpIndicator;

  @ManyToOne(() => Sector)
  @JoinColumn({ name: 'sector_id' })
  sector: Sector;

  @ManyToOne(() => Type)
  @JoinColumn({ name: 'type_id' })
  type: Type;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(
    () => MsnpIndicatorDisaggregation,
    (disaggregation) => disaggregation.configuration,
    { cascade: true },
  )
  disaggregations: MsnpIndicatorDisaggregation[];
}
