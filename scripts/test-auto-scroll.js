const BASE_URL = 'http://localhost:3000/api';

async function sendTestMessage(roomId) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Auto test ' + Date.now(),
      type: 'text',
      userType: 'guest',
      userId: 'test-user-id',
      themeId: 'default',
      roomId: roomId || null
    })
  });
  console.log('Sent:', res.status);
}

sendTestMessage();
