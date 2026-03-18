import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SectorTranslation } from './sector-translation.entity';

@Entity('sectors')
export class Sector extends BaseEntity {
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => SectorTranslation, (translation) => translation.sector, {
    cascade: true,
  })
  translations: SectorTranslation[];
}
