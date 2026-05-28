import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MsnpIndicator } from '../../msnp-indicators/entities/msnp-indicator.entity';
import { Sector } from '../../sectors/entities/sector.entity';
import { Type } from '../../types/entities/type.entity';
import { Role } from '../../roles/entities/role.entity';

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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

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
}
