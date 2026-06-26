import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Content } from '../../contents/entities/content.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('child_contents')
export class ChildContent extends BaseEntity {
  @Column({ type: 'jsonb' })
  title: LocalizedField;

  @Column()
  slug: string;

  @Column({ name: 'html_content', type: 'jsonb' })
  htmlContent: LocalizedField;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Index()
  @ManyToOne(() => Content, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Content;
}
