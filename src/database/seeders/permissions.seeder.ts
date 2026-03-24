import { DataSource } from 'typeorm';
import { Permission } from '../../modules/roles/entities/permission.entity';

const permissions = [
  // Sectors
  {
    resource: 'sectors',
    action: 'view',
    description: 'View sectors',
    category: 'Masters',
  },
  {
    resource: 'sectors',
    action: 'create',
    description: 'Create sectors',
    category: 'Masters',
  },
  {
    resource: 'sectors',
    action: 'update',
    description: 'Update sectors',
    category: 'Masters',
  },
  {
    resource: 'sectors',
    action: 'delete',
    description: 'Delete sectors',
    category: 'Masters',
  },

  // MSNP Indicators
  {
    resource: 'msnp-indicators',
    action: 'view',
    description: 'View MSNP indicators',
    category: 'Masters',
  },
  {
    resource: 'msnp-indicators',
    action: 'create',
    description: 'Create MSNP indicators',
    category: 'Masters',
  },
  {
    resource: 'msnp-indicators',
    action: 'update',
    description: 'Update MSNP indicators',
    category: 'Masters',
  },
  {
    resource: 'msnp-indicators',
    action: 'delete',
    description: 'Delete MSNP indicators',
    category: 'Masters',
  },

  // Frequencies
  {
    resource: 'frequencies',
    action: 'view',
    description: 'View frequencies',
    category: 'Masters',
  },
  {
    resource: 'frequencies',
    action: 'create',
    description: 'Create frequencies',
    category: 'Masters',
  },
  {
    resource: 'frequencies',
    action: 'update',
    description: 'Update frequencies',
    category: 'Masters',
  },
  {
    resource: 'frequencies',
    action: 'delete',
    description: 'Delete frequencies',
    category: 'Masters',
  },

  // Genders
  {
    resource: 'genders',
    action: 'view',
    description: 'View genders',
    category: 'Masters',
  },
  {
    resource: 'genders',
    action: 'create',
    description: 'Create genders',
    category: 'Masters',
  },
  {
    resource: 'genders',
    action: 'update',
    description: 'Update genders',
    category: 'Masters',
  },
  {
    resource: 'genders',
    action: 'delete',
    description: 'Delete genders',
    category: 'Masters',
  },

  // Age Groups
  {
    resource: 'age-groups',
    action: 'view',
    description: 'View age groups',
    category: 'Masters',
  },
  {
    resource: 'age-groups',
    action: 'create',
    description: 'Create age groups',
    category: 'Masters',
  },
  {
    resource: 'age-groups',
    action: 'update',
    description: 'Update age groups',
    category: 'Masters',
  },
  {
    resource: 'age-groups',
    action: 'delete',
    description: 'Delete age groups',
    category: 'Masters',
  },

  // Types
  {
    resource: 'types',
    action: 'view',
    description: 'View types',
    category: 'Masters',
  },
  {
    resource: 'types',
    action: 'create',
    description: 'Create types',
    category: 'Masters',
  },
  {
    resource: 'types',
    action: 'update',
    description: 'Update types',
    category: 'Masters',
  },
  {
    resource: 'types',
    action: 'delete',
    description: 'Delete types',
    category: 'Masters',
  },

  // Administrative Levels
  {
    resource: 'administrative-levels',
    action: 'view',
    description: 'View administrative levels',
    category: 'Masters',
  },
  {
    resource: 'administrative-levels',
    action: 'create',
    description: 'Create administrative levels',
    category: 'Masters',
  },
  {
    resource: 'administrative-levels',
    action: 'update',
    description: 'Update administrative levels',
    category: 'Masters',
  },
  {
    resource: 'administrative-levels',
    action: 'delete',
    description: 'Delete administrative levels',
    category: 'Masters',
  },

  // Audit Logs
  {
    resource: 'audit-logs',
    action: 'view',
    description: 'View audit logs',
    category: 'Audit',
  },

  // Users
  {
    resource: 'users',
    action: 'view',
    description: 'View users',
    category: 'User Management',
  },
  {
    resource: 'users',
    action: 'create',
    description: 'Create users',
    category: 'User Management',
  },
  {
    resource: 'users',
    action: 'update',
    description: 'Update users',
    category: 'User Management',
  },
  {
    resource: 'users',
    action: 'delete',
    description: 'Delete users',
    category: 'User Management',
  },

  // Roles
  {
    resource: 'roles',
    action: 'view',
    description: 'View custom roles',
    category: 'User Management',
  },
  {
    resource: 'roles',
    action: 'create',
    description: 'Create custom roles',
    category: 'User Management',
  },
  {
    resource: 'roles',
    action: 'update',
    description: 'Update custom roles',
    category: 'User Management',
  },
  {
    resource: 'roles',
    action: 'delete',
    description: 'Delete custom roles',
    category: 'User Management',
  },

  // Permissions
  {
    resource: 'permissions',
    action: 'view',
    description: 'List available permissions',
    category: 'User Management',
  },
];

export const seedPermissions = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(Permission);

  for (const p of permissions) {
    const existing = await repository.findOne({
      where: { resource: p.resource, action: p.action },
    });

    if (!existing) {
      await repository.save(repository.create(p));
      console.log(
        `Created permission: ${p.resource}:${p.action} (${p.category})`,
      );
    } else if (existing.category !== p.category) {
      existing.category = p.category;
      await repository.save(existing);
      console.log(
        `Updated category for permission: ${p.resource}:${p.action} -> ${p.category}`,
      );
    }
  }
};
