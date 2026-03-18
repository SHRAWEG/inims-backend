import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AgeGroup } from './age-group.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('age_group_translations')
@Index(['ageGroupId', 'locale'], { unique: true })
export class AgeGroupTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'age_group_id', type: 'uuid' })
  ageGroupId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => AgeGroup, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'age_group_id' })
  parent: AgeGroup;
}
