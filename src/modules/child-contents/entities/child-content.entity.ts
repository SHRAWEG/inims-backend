import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Content } from '../../contents/entities/content.entity';

@Entity('child_contents')
export class ChildContent extends BaseEntity {
  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ name: 'html_content', type: 'text' })
  htmlContent: string;

  @Index()
  @ManyToOne(() => Content, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Content;
}
