/**
 * Test script to verify login endpoint works
 */
import fetch from 'node-fetch';

async function testLogin() {
  console.log('\n🧪 Testing login endpoint...\n');
  
  const phone = '+251905728376';
  const password = 'admin321';
  
  try {
    const res = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    
    const data = await res.json();
    
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('\n✅ Login successful!');
      console.log('User role:', data.user?.role);
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testLogin();
