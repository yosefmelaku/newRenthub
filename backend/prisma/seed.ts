/**
 * prisma/seed.ts
 * 
 * Creates the default SUPER_ADMIN account for the rental platform.
 * 
 * Credentials:
 *   Name: Yosef Melalaku
 *   Phone: +241905728376
 *   Password: admin321
 * 
 * Run with: bun run seed (or npx prisma db seed)
 */

import dotenv from 'dotenv';
import path from 'path';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const SALT_ROUNDS = 12;

async function main() {
  // Default SUPER_ADMIN credentials as specified
  const phone = '+251905728376';
  const name = 'Yosef Melalaku';
  const password = 'admin321';

  // Derive email as expected by backend auth routes
  // Auth controller uses phone.replace(/[^0-9]/g, '') + '@phone.user'
  const derivedEmail = `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`;

  console.log(`\n🔍 Checking if SUPER_ADMIN user already exists...`);
  console.log(`   Email: ${derivedEmail}`);
  console.log(`   Phone: ${phone}\n`);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: derivedEmail },
        { phone: phone }
      ]
    }
  });

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing) {
    console.log(`✓ User already exists, updating to SUPERADMIN role...`);
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
    console.log(`✓ SUPER_ADMIN user successfully updated:`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   Name: ${updated.full_name}`);
    console.log(`   Email: ${updated.email}`);
    console.log(`   Phone: ${updated.phone}`);
    console.log(`   Role: ${updated.role}\n`);
  } else {
    console.log(`✓ Creating new SUPER_ADMIN user...`);
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
    console.log(`✓ SUPER_ADMIN user successfully created:`);
    console.log(`   ID: ${created.id}`);
    console.log(`   Name: ${created.full_name}`);
    console.log(`   Email: ${created.email}`);
    console.log(`   Phone: ${created.phone}`);
    console.log(`   Role: ${created.role}\n`);
  }

  console.log(`🎉 Seeding complete! You can now log in at http://localhost:5173/admin`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Password: ${password}\n`);
}

main()
  .catch((e) => {
    console.error('\n❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
