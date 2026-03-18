import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdministrativeLevel as AdministrativeLevelEntity } from './administrative-level.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('administrative_level_translations')
@Index(['administrativeLevelId', 'locale'], { unique: true })
export class AdministrativeLevelTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'administrative_level_id', type: 'uuid' })
  administrativeLevelId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => AdministrativeLevelEntity, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'administrative_level_id' })
  parent: AdministrativeLevelEntity;
}
