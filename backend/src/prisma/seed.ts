import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingAdmins = await prisma.users.count({
    where: { role: 'admin' },
  });

  if (existingAdmins > 0) {
    console.log('Ya existe al menos un usuario admin. Seed sin cambios.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.users.create({
    data: {
      name: 'Admin',
      email: 'admin@novasalud.com',
      role: 'admin',
      active: true,
      password_hash: passwordHash,
    },
  });

  console.log('Admin seed listo:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    active: admin.active,
  });
}

main()
  .catch((error) => {
    console.error('Error en seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
