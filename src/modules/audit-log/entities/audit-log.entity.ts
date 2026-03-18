import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction } from '../../../common/enums/audit-action.enum';

/**
 * Append-only audit log. Does NOT extend BaseEntity:
 * - No updatedAt (logs are never updated)
 * - No deletedAt (logs are never deleted)
 * - No FK on userId (user may be deleted; audit history must persist)
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ name: 'action', type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Index()
  @Column({ name: 'resource', type: 'varchar', length: 100 })
  resource: string;

  @Index()
  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ name: 'before_snapshot', type: 'jsonb', nullable: true })
  before: Record<string, any> | null;

  @Column({ name: 'after_snapshot', type: 'jsonb', nullable: true })
  after: Record<string, any> | null;

  @Column({ name: 'diff', type: 'jsonb', nullable: true })
  diff: Record<string, any>[] | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
