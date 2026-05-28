import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LocalizedField } from '../../../common/types/i18n.type';
import { Permission } from './permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: LocalizedField;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
