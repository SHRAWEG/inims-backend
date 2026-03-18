import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Type as TypeEntity } from './type.entity';
import { SupportedLocale } from '../../../common/types/i18n.type';

@Entity('type_translations')
@Index(['typeId', 'locale'], { unique: true })
export class TypeTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type_id', type: 'uuid' })
  typeId: string;

  @Column({ name: 'locale', type: 'varchar', length: 10 })
  locale: SupportedLocale;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => TypeEntity, (parent) => parent.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'type_id' })
  parent: TypeEntity;
}
