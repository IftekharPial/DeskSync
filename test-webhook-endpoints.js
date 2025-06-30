// Test webhook endpoints to verify both issues
async function testWebhookEndpoints() {
  console.log('🔍 Testing Webhook Endpoints\n');

  const API_BASE = 'http://localhost:3001';

  // Test 1: Get webhooks list to check URL field
  console.log('1️⃣ Testing Webhooks List API...');
  try {
    const response = await fetch(`${API_BASE}/api/webhooks`);
    const data = await response.json();
    
    console.log('✅ Webhooks API Response:');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Total webhooks:', data.data?.length);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 First webhook details:');
      const firstWebhook = data.data[0];
      console.log('ID:', firstWebhook.id);
      console.log('Name:', firstWebhook.name);
      console.log('URL:', firstWebhook.url);
      console.log('Status:', firstWebhook.status);
      console.log('Type:', firstWebhook.type);
      
      if (firstWebhook.url) {
        console.log('✅ URL field is present and populated');
      } else {
        console.log('❌ URL field is missing or undefined');
      }
    }
  } catch (error) {
    console.log('❌ Error testing webhooks list:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 2: Test webhook receive endpoint with GET (should fail)
  console.log('\n2️⃣ Testing Webhook Receive Endpoint with GET (should fail)...');
  try {
    const response = await fetch(`${API_BASE}/api/webhooks/1/receive`, {
      method: 'GET'
    });
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.status === 404) {
      console.log('✅ Expected: GET request correctly returns 404');
    } else {
      console.log('❌ Unexpected: GET request should return 404');
    }
  } catch (error) {
    console.log('❌ Error testing GET request:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 3: Test webhook receive endpoint with POST (should work)
  console.log('\n3️⃣ Testing Webhook Receive Endpoint with POST (should work)...');
  try {
    const testPayload = {
      test: true,
      message: 'Testing webhook receive endpoint',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${API_BASE}/api/webhooks/1/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Message:', data.message);
    
    if (response.ok && data.success) {
      console.log('✅ POST request works correctly');
      console.log('Received:', data.data?.received);
      console.log('Processed at:', data.data?.processedAt);
    } else {
      console.log('❌ POST request failed');
    }
  } catch (error) {
    console.log('❌ Error testing POST request:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 4: Test individual webhook details
  console.log('\n4️⃣ Testing Individual Webhook Details...');
  try {
    const response = await fetch(`${API_BASE}/api/webhooks/1`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.data) {
      console.log('Webhook details:');
      console.log('ID:', data.data.id);
      console.log('Name:', data.data.name);
      console.log('URL:', data.data.url);
      console.log('Description:', data.data.description);
      
      if (data.data.url) {
        console.log('✅ Individual webhook URL field is present');
        console.log('Complete URL would be:', `${API_BASE}${data.data.url}`);
      } else {
        console.log('❌ Individual webhook URL field is missing');
      }
    }
  } catch (error) {
    console.log('❌ Error testing individual webhook:', error.message);
  }

  console.log('\n' + '='.repeat(50));

  // Test 5: Test meeting webhook with POST
  console.log('\n5️⃣ Testing Meeting Webhook with POST...');
  try {
    const meetingPayload = {
      hostId: '12345',
      meetingTitle: 'Endpoint Test Meeting',
      startTime: new Date().toISOString(),
      duration: 30,
      clientName: 'Test Client',
      notes: 'Testing meeting webhook endpoint',
      attendees: ['test@example.com'],
      actionItems: ['Verify endpoint functionality']
    };

    const response = await fetch(`${API_BASE}/api/webhooks/2/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingPayload)
    });
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Meeting created:', data.data?.meetingCreated);
    
    if (response.ok && data.success) {
      console.log('✅ Meeting webhook works correctly');
      if (data.data?.createdMeeting) {
        console.log('Created meeting ID:', data.data.createdMeeting.id);
        console.log('Meeting title:', data.data.createdMeeting.title);
      }
    } else {
      console.log('❌ Meeting webhook failed');
    }
  } catch (error) {
    console.log('❌ Error testing meeting webhook:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 ENDPOINT TESTING COMPLETE');
  console.log('='.repeat(60));
}

// Run the tests
testWebhookEndpoints();
