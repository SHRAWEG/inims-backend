import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChildContent } from '../../child-contents/entities/child-content.entity';

@Entity('contents')
export class Content extends BaseEntity {
  @Index()
  @Column({ unique: true })
  title: string;

  @Index()
  @Column({ unique: true })
  slug: string;

  @Column({ name: 'html_content', type: 'text' })
  htmlContent: string;

  @OneToMany(() => ChildContent, (child) => child.parent)
  children: ChildContent[];
}
