import { DataSource } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { SystemRole } from '../../common/enums/system-role.enum';
import * as bcrypt from 'bcrypt';

export const seedSuperAdmin = async (dataSource: DataSource) => {
  const userRepository = dataSource.getRepository(User);
  const email = 'admin@inims.com.np';

  const existingAdmin = await userRepository.findOne({ where: { email } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123', 10);

    const superAdmin = userRepository.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: email,
      passwordHash: passwordHash,
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
    });

    await userRepository.save(superAdmin);
    console.log(
      `[SuperAdmin Seeder] Created superadmin with email: ${email} and password: Admin123`,
    );
  } else {
    console.log('[SuperAdmin Seeder] Superadmin already exists. Skipping...');
  }
};
