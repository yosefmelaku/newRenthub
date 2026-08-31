/**
 * Quick script to verify the superadmin account exists
 */
import prisma from './lib/prisma';

async function check() {
  console.log('\n🔍 Checking for SUPERADMIN account...\n');
  
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' }
  });

  if (admin) {
    console.log('✅ SUPERADMIN account found:');
    console.log('   ID:', admin.id);
    console.log('   Name:', admin.full_name);
    console.log('   Email:', admin.email);
    console.log('   Phone:', admin.phone);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.is_active);
    console.log('\n');
  } else {
    console.log('❌ No SUPERADMIN account found!\n');
  }

  await prisma.$disconnect();
}

check();
