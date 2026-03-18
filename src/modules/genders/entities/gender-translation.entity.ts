import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Gender } from './gender.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('gender_translations')
@Index(['genderId', 'locale'], { unique: true })
export class GenderTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gender_id', type: 'uuid' })
  genderId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Gender, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gender_id' })
  parent: Gender;
}
