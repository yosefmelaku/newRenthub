/**
 * Cleanup duplicate admin accounts and keep only the one with correct phone
 */
import prisma from './lib/prisma';

async function cleanup() {
  console.log('\n🧹 Cleaning up admin accounts...\n');
  
  // Find all superadmin accounts
  const admins = await prisma.user.findMany({
    where: { role: 'SUPERADMIN' }
  });

  console.log(`Found ${admins.length} SUPERADMIN account(s):`);
  admins.forEach(a => {
    console.log(`  - ${a.phone} (${a.email})`);
  });

  // Keep only the one with correct phone number
  const correctPhone = '+251905728376';
  const toDelete = admins.filter(a => a.phone !== correctPhone);

  if (toDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${toDelete.length} incorrect account(s)...`);
    for (const admin of toDelete) {
      await prisma.user.delete({ where: { id: admin.id } });
      console.log(`   ✓ Deleted ${admin.phone}`);
    }
  }

  console.log('\n✅ Cleanup complete!\n');
  await prisma.$disconnect();
}

cleanup();
