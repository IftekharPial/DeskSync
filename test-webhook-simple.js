// Simple webhook test using Node.js built-in fetch
async function testWebhook() {
  console.log('🧪 Testing Meeting Webhook...\n');

  const testPayload = {
    hostId: '12345',
    meetingTitle: 'Test Meeting - Client Demo',
    startTime: new Date().toISOString(),
    duration: 45,
    clientName: 'Test Client Corp',
    notes: 'This is a test meeting created from webhook',
    attendees: ['test.client@example.com'],
    actionItems: ['Follow up with client', 'Send demo materials']
  };

  try {
    console.log('📤 Sending webhook payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('http://localhost:3001/api/webhooks/2/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('\n✅ Webhook response:', JSON.stringify(result, null, 2));

    // Check if meeting was created
    console.log('\n📋 Checking meeting reports...');
    const meetingsResponse = await fetch('http://localhost:3001/api/reports/meeting');
    const meetings = await meetingsResponse.json();
    console.log('Meeting reports:', JSON.stringify(meetings, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebhook();
