import dotenv from 'dotenv';
import path from 'path';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const SALT_ROUNDS = 12;

async function main() {
  const phone = process.env.SEED_ADMIN_PHONE || '+251905728376';
  const name = process.env.SEED_ADMIN_NAME || 'Yosef Melalaku';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD environment variable is missing. Please define it in your .env file.');
  }

  // Derive email as expected by backend auth routes
  const derivedEmail = `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`;

  console.log(`Checking if SUPER_ADMIN user already exists with email: ${derivedEmail} or phone: ${phone}...`);
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: derivedEmail },
        { phone: phone }
      ]
    }
  });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing) {
    console.log(`User already exists, updating to SUPERADMIN...`);
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        full_name: name,
        email: derivedEmail,
        phone: phone,
        password_hash: passwordHash,
        role: 'SUPERADMIN',
        is_active: true
      }
    });
    console.log(`SUPER_ADMIN user successfully updated:`, updated.email);
  } else {
    console.log(`Creating SUPER_ADMIN user...`);
    const created = await prisma.user.create({
      data: {
        full_name: name,
        email: derivedEmail,
        phone: phone,
        password_hash: passwordHash,
        role: 'SUPERADMIN',
        is_active: true
      }
    });
    console.log(`SUPER_ADMIN user successfully created:`, created.email);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
