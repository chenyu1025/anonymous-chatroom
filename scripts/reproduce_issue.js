
const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🚀 Testing Room Creation...');

  try {
    const createRes = await fetch(`${BASE_URL}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-password' })
    });
    
    console.log('Status:', createRes.status);
    const text = await createRes.text();
    console.log('Body:', text);

    if (!createRes.ok) {
        console.error('❌ Failed');
    } else {
        const data = JSON.parse(text);
        console.log('✅ Success, roomId:', data.roomId);
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

runTest();
