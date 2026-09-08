/**
 * Quick script to update admin password
 * Run with: bun run update-admin-password.ts
 */

import prisma from './lib/prisma';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function updateAdminPassword() {
  const phone = '+251905728376';
  const newPassword = 'admin@321';
  
  console.log('\n🔄 Updating admin password...\n');
  
  const derivedEmail = `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`;
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: derivedEmail },
        { phone: phone }
      ]
    }
  });
  
  if (!user) {
    console.error('❌ Admin user not found!');
    console.log('   Creating new admin user...\n');
    
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const created = await prisma.user.create({
      data: {
        full_name: 'Yosef Melalaku',
        email: derivedEmail,
        phone: phone,
        password_hash: passwordHash,
        role: 'SUPERADMIN',
        is_active: true
      }
    });
    
    console.log('✅ Admin user created!');
    console.log(`   ID: ${created.id}`);
    console.log(`   Name: ${created.full_name}`);
    console.log(`   Phone: ${created.phone}`);
    console.log(`   Password: ${newPassword}\n`);
    return;
  }
  
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      role: 'SUPERADMIN',
      is_active: true
    }
  });
  
  console.log('✅ Password updated successfully!');
  console.log(`   User: ${user.full_name}`);
  console.log(`   Phone: ${phone}`);
  console.log(`   New Password: ${newPassword}`);
  console.log(`\n🎉 You can now login at http://localhost:5173/admin\n`);
}

updateAdminPassword()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
