import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChildContent } from '../../child-contents/entities/child-content.entity';
import { LocalizedField } from '../../../common/types/i18n.type';

@Entity('contents')
export class Content extends BaseEntity {
  @Column({ type: 'jsonb' })
  title: LocalizedField;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column({ name: 'html_content', type: 'jsonb', nullable: true })
  htmlContent: LocalizedField | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => ChildContent, (child) => child.parent)
  children: ChildContent[];
}
