import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sector } from './sector.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('sector_translations')
@Index(['sectorId', 'locale'], { unique: true })
export class SectorTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sector_id', type: 'uuid' })
  sectorId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Sector, (sector) => sector.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sector_id' })
  sector: Sector;
}
