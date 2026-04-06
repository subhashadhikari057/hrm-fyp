import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function upsertSuperAdmin() {
  const password = await bcrypt.hash('superadmin123', SALT_ROUNDS);

  return prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {
      password,
      fullName: 'System Super Admin',
      phone: '+9779800000000',
      role: UserRole.super_admin,
      isActive: true,
    },
    create: {
      email: 'superadmin@gmail.com',
      password,
      fullName: 'System Super Admin',
      phone: '+9779800000000',
      role: UserRole.super_admin,
      isActive: true,
    },
  });
}

async function main() {
  console.log('Seeding super admin only...');

  const superAdmin = await upsertSuperAdmin();

  console.log('Super admin ready:');
  console.log(`- Email: ${superAdmin.email}`);
  console.log('- Password: superadmin123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
