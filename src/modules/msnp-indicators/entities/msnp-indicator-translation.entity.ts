import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MsnpIndicator } from './msnp-indicator.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('msnp_indicator_translations')
@Index(['msnpIndicatorId', 'locale'], { unique: true })
export class MsnpIndicatorTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'msnp_indicator_id', type: 'uuid' })
  msnpIndicatorId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => MsnpIndicator, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'msnp_indicator_id' })
  parent: MsnpIndicator;
}
