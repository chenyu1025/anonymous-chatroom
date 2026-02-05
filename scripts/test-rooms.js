const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🚀 Starting Room Feature Test...');

  // 1. Create a Room
  console.log('\n1️⃣  Creating a new room...');
  const createRes = await fetch(`${BASE_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' })
  });
  
  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('❌ Create failed:', createRes.status, err);
    if (createRes.status === 500) {
      console.error('⚠️  Hint: Did you run the SQL migration in Supabase?');
    }
    return;
  }
  
  const { roomId } = await createRes.json();
  console.log('✅ Room created with ID:', roomId);

  // 2. Verify Room Password
  console.log('\n2️⃣  Verifying password...');
  const verifyRes = await fetch(`${BASE_URL}/rooms/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, password: 'test-password' })
  });

  if (verifyRes.ok) {
    console.log('✅ Password verification successful');
  } else {
    console.error('❌ Password verification failed');
    return;
  }

  // 2.5 Register User in Room
  console.log('\n2️⃣.5️⃣  Registering user in room...');
  const userId = 'test-user-' + Math.random().toString(36).substr(2, 9);
  
  const userRes = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userType: 'guest',
      sessionId: userId,
      roomId: roomId
    })
  });

  if (userRes.ok) {
    console.log('✅ User registered in room');
  } else {
    console.error('❌ User registration failed:', await userRes.text());
    return;
  }

  // 3. Send Message to Room
  console.log('\n3️⃣  Sending message to private room...');
  const msgContent = 'Hello Secret World ' + Date.now();
  
  const sendRes = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: msgContent,
      type: 'text',
      userType: 'guest',
      userId: userId,
      roomId: roomId
    })
  });

  if (sendRes.ok) {
    console.log('✅ Message sent successfully');
  } else {
    console.error('❌ Send message failed:', await sendRes.text());
    return;
  }

  // 4. Fetch Messages from Room
  console.log('\n4️⃣  Fetching messages from private room...');
  const getRoomMsgsRes = await fetch(`${BASE_URL}/messages?roomId=${roomId}&limit=10`);
  const roomData = await getRoomMsgsRes.json();
  
  const foundMsg = roomData.messages?.find(m => m.content === msgContent);
  if (foundMsg) {
    console.log('✅ Found sent message in private room');
  } else {
    console.error('❌ Could not find message in private room. Messages found:', roomData.messages?.length);
  }

  // 5. Fetch Messages from Public Lobby (should NOT find the message)
  console.log('\n5️⃣  Fetching messages from public lobby...');
  const getPublicMsgsRes = await fetch(`${BASE_URL}/messages?limit=10`);
  const publicData = await getPublicMsgsRes.json();
  
  const leakedMsg = publicData.messages?.find(m => m.content === msgContent);
  if (!leakedMsg) {
    console.log('✅ Message successfully ISOLATED (not found in public lobby)');
  } else {
    console.error('❌ DATA LEAK! Private message found in public lobby!');
  }

  console.log('\n🎉 Test Completed!');
}

runTest().catch(console.error);
