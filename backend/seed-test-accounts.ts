/**
 * seed-test-accounts.ts
 * 
 * Creates test accounts for easy switching:
 * - Super Admin (already exists)
 * - Owner account
 * - Tenant account
 * 
 * Run with: bun run seed-test-accounts.ts
 */

import prisma from './lib/prisma';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'test123'; // Simple password for testing

async function main() {
  console.log('\n🔐 Creating test accounts for Account Switcher...\n');

  // 1. Super Admin (update existing or create)
  const adminPhone = '+251905728376';
  const adminEmail = '251905728376@phone.user';
  const adminPassword = 'admin@321';

  const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      full_name: 'Yosef Melalaku',
      password_hash: adminHash,
      role: 'SUPERADMIN',
      is_active: true,
    },
    create: {
      full_name: 'Yosef Melalaku',
      email: adminEmail,
      phone: adminPhone,
      password_hash: adminHash,
      role: 'SUPERADMIN',
      is_active: true,
    },
  });
  
  console.log('✅ Super Admin Account:');
  console.log(`   Name: ${admin.full_name}`);
  console.log(`   Phone: ${adminPhone}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: ${admin.role}\n`);

  // 2. Owner Account
  const ownerPhone = '+251911111111';
  const ownerEmail = '251911111111@phone.user';
  
  const ownerHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      full_name: 'John Property Owner',
      password_hash: ownerHash,
      role: 'OWNER',
      is_active: true,
    },
    create: {
      full_name: 'John Property Owner',
      email: ownerEmail,
      phone: ownerPhone,
      password_hash: ownerHash,
      role: 'OWNER',
      is_active: true,
    },
  });
  
  console.log('✅ Owner Account:');
  console.log(`   Name: ${owner.full_name}`);
  console.log(`   Phone: ${ownerPhone}`);
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
  console.log(`   Role: ${owner.role}\n`);

  // 3. Tenant Account
  const tenantPhone = '+251922222222';
  const tenantEmail = '251922222222@phone.user';
  
  const tenantHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
  const tenant = await prisma.user.upsert({
    where: { email: tenantEmail },
    update: {
      full_name: 'Jane Tenant',
      password_hash: tenantHash,
      role: 'TENANT',
      is_active: true,
    },
    create: {
      full_name: 'Jane Tenant',
      email: tenantEmail,
      phone: tenantPhone,
      password_hash: tenantHash,
      role: 'TENANT',
      is_active: true,
    },
  });
  
  console.log('✅ Tenant Account:');
  console.log(`   Name: ${tenant.full_name}`);
  console.log(`   Phone: ${tenantPhone}`);
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
  console.log(`   Role: ${tenant.role}\n`);

  console.log('🎉 All test accounts created successfully!\n');
  console.log('📋 Summary:');
  console.log('   1. Super Admin - Yosef Melalaku (+251905728376 / admin@321)');
  console.log('   2. Owner - John Property Owner (+251911111111 / test123)');
  console.log('   3. Tenant - Jane Tenant (+251922222222 / test123)\n');
  console.log('💡 You can now use the Account Switcher in the navbar to switch between accounts!\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
