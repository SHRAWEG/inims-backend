import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('fiscal_years')
export class FiscalYear extends BaseEntity {
  @Column({ type: 'varchar', length: 7, unique: true })
  year: string;

  @Column({ name: 'start_date_ad', type: 'date', nullable: true })
  startDateAd: Date | null;

  @Column({ name: 'end_date_ad', type: 'date', nullable: true })
  endDateAd: Date | null;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;
}
