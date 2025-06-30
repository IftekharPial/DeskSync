// Test real Slack webhook delivery
async function testSlackDelivery() {
  console.log('🔍 Testing Real Slack Webhook Delivery\n');

  const API_BASE = 'http://localhost:3001';

  try {
    // Test 1: Direct Slack webhook test
    console.log('1️⃣ Testing direct Slack webhook...');
    const slackUrl = 'https://hooks.slack.com/services/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';
    
    const directResponse = await fetch(slackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: '🧪 Direct test from DailySync webhook system',
        username: 'DailySync Bot',
        icon_emoji: ':robot_face:'
      })
    });

    console.log(`Direct Slack test: ${directResponse.status} ${directResponse.statusText}`);
    if (directResponse.ok) {
      console.log('✅ Direct Slack webhook is working!');
    } else {
      console.log('❌ Direct Slack webhook failed');
      const errorText = await directResponse.text();
      console.log('Error:', errorText);
    }

    console.log('\n' + '='.repeat(50));

    // Test 2: Test through DailySync webhook system
    console.log('\n2️⃣ Testing through DailySync webhook system...');
    
    const testPayload = {
      type: 'test',
      message: 'Testing real webhook delivery from DailySync',
      userName: 'Test User',
      timestamp: new Date().toISOString(),
      source: 'webhook_test'
    };

    const webhookResponse = await fetch(`${API_BASE}/api/webhooks/1/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const webhookData = await webhookResponse.json();
    
    console.log(`Webhook system test: ${webhookResponse.status} ${webhookResponse.statusText}`);
    console.log('Response:', JSON.stringify(webhookData, null, 2));

    if (webhookResponse.ok && webhookData.success) {
      console.log('✅ DailySync webhook system is working!');
      
      if (webhookData.data?.deliveryResults) {
        console.log('\n📊 Delivery Results:');
        webhookData.data.deliveryResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.endpointName}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
          if (result.success) {
            console.log(`      Status: ${result.statusCode}`);
            console.log(`      Duration: ${result.duration}ms`);
            console.log(`      Template: ${result.templateUsed}`);
          } else {
            console.log(`      Error: ${result.message || result.error}`);
          }
        });
      }
    } else {
      console.log('❌ DailySync webhook system failed');
    }

    console.log('\n' + '='.repeat(50));

    // Test 3: Test meeting webhook (should trigger Slack notification)
    console.log('\n3️⃣ Testing meeting webhook (should send Slack notification)...');
    
    const meetingPayload = {
      hostId: '12345',
      meetingTitle: 'Real Slack Integration Test Meeting',
      startTime: new Date().toISOString(),
      duration: 30,
      clientName: 'Test Client',
      notes: 'Testing real Slack webhook integration',
      attendees: ['test@example.com'],
      actionItems: ['Verify Slack message delivery', 'Check webhook logs']
    };

    const meetingResponse = await fetch(`${API_BASE}/api/webhooks/2/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingPayload)
    });

    const meetingData = await meetingResponse.json();
    
    console.log(`Meeting webhook test: ${meetingResponse.status} ${meetingResponse.statusText}`);
    
    if (meetingResponse.ok && meetingData.success) {
      console.log('✅ Meeting webhook processed successfully!');
      console.log(`Meeting created: ${meetingData.data?.meetingCreated}`);
      console.log(`Meeting ID: ${meetingData.data?.createdMeeting?.id}`);
      
      if (meetingData.data?.deliveryResults) {
        console.log('\n📊 Meeting Delivery Results:');
        meetingData.data.deliveryResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.endpointName}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
          if (result.success) {
            console.log(`      Status: ${result.statusCode}`);
            console.log(`      Duration: ${result.duration}ms`);
            console.log(`      Template: ${result.templateUsed}`);
          } else {
            console.log(`      Error: ${result.message || result.error}`);
          }
        });
      }
    } else {
      console.log('❌ Meeting webhook failed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 SLACK DELIVERY TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('📋 Check your Slack channel for messages!');
    console.log('🔗 Logs available at: http://localhost:3000/dashboard/webhooks/1/logs');
    console.log('🔗 Meeting logs at: http://localhost:3000/dashboard/webhooks/2/logs');

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Run the test
testSlackDelivery();
