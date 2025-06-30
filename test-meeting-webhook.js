// Test script for meeting webhook functionality
// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3001';

async function testMeetingWebhook() {
  console.log('🧪 Testing Meeting Webhook Functionality\n');

  try {
    // 1. Test webhook test endpoint
    console.log('1️⃣ Testing webhook test endpoint...');
    const testResponse = await fetch(`${API_BASE}/api/webhooks/2/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostId: '12345',
        meetingTitle: 'Test Meeting - Client Demo',
        startTime: new Date().toISOString(),
        duration: 45,
        clientName: 'Test Client Corp',
        notes: 'This is a test meeting created from webhook test',
        attendees: ['test.client@example.com'],
        actionItems: ['Follow up with client', 'Send demo materials']
      })
    });

    const testResult = await testResponse.json();
    console.log('✅ Webhook test result:', JSON.stringify(testResult, null, 2));

    // 2. Check if meeting was created
    console.log('\n2️⃣ Checking if meeting was created...');
    const meetingsResponse = await fetch(`${API_BASE}/api/reports/meeting`);
    const meetingsResult = await meetingsResponse.json();
    console.log('📋 Meeting reports:', JSON.stringify(meetingsResult, null, 2));

    // 3. Test message templates
    console.log('\n3️⃣ Testing message templates...');
    const templatesResponse = await fetch(`${API_BASE}/api/message-templates?webhookType=MEETING`);
    const templatesResult = await templatesResponse.json();
    console.log('📝 Meeting templates:', JSON.stringify(templatesResult, null, 2));

    // 4. Test webhook receive endpoint directly
    console.log('\n4️⃣ Testing webhook receive endpoint directly...');
    const receiveResponse = await fetch(`${API_BASE}/api/webhooks/2/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({
        hostId: '12345',
        meetingTitle: 'Direct Test Meeting',
        startTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        duration: 30,
        clientName: 'Direct Test Client',
        notes: 'This meeting was created by directly calling the webhook receive endpoint'
      })
    });

    const receiveResult = await receiveResponse.json();
    console.log('📨 Direct webhook receive result:', JSON.stringify(receiveResult, null, 2));

    // 5. Check meeting reports again
    console.log('\n5️⃣ Checking meeting reports after direct webhook call...');
    const finalMeetingsResponse = await fetch(`${API_BASE}/api/reports/meeting`);
    const finalMeetingsResult = await finalMeetingsResponse.json();
    console.log('📋 Final meeting reports:', JSON.stringify(finalMeetingsResult, null, 2));

    console.log('\n🎉 Meeting webhook test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMeetingWebhook();
