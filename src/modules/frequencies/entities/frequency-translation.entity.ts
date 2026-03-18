import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Frequency } from './frequency.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('frequency_translations')
@Index(['frequencyId', 'locale'], { unique: true })
export class FrequencyTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'frequency_id', type: 'uuid' })
  frequencyId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Frequency, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'frequency_id' })
  parent: Frequency;
}
