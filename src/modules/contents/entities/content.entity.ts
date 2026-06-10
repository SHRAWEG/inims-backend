import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

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
}
