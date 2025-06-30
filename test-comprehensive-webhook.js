// Comprehensive test for all webhook functionality
async function runComprehensiveTest() {
  console.log('🧪 Running Comprehensive Webhook Test Suite\n');

  const API_BASE = 'http://localhost:3001';
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (details) console.log(`   ${details}`);
    
    testResults.tests.push({ name, passed, details });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    // Test 1: API Health Check
    console.log('1️⃣ Testing API Health...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    logTest('API Health Check', healthResponse.ok && healthData.success, `Status: ${healthData.data?.status}`);

    // Test 2: Get Webhooks
    console.log('\n2️⃣ Testing Webhook Listing...');
    const webhooksResponse = await fetch(`${API_BASE}/api/webhooks`);
    const webhooksData = await webhooksResponse.json();
    logTest('Get Webhooks', webhooksResponse.ok && Array.isArray(webhooksData.data), `Found ${webhooksData.data?.length} webhooks`);

    // Test 3: Get Message Templates
    console.log('\n3️⃣ Testing Message Templates...');
    const templatesResponse = await fetch(`${API_BASE}/api/message-templates`);
    const templatesData = await templatesResponse.json();
    logTest('Get Message Templates', templatesResponse.ok && Array.isArray(templatesData.data), `Found ${templatesData.data?.length} templates`);

    // Test 4: Test Meeting Webhook (ID: 2)
    console.log('\n4️⃣ Testing Meeting Webhook...');
    const meetingTestResponse = await fetch(`${API_BASE}/api/webhooks/2/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: '12345',
        meetingTitle: 'Comprehensive Test Meeting',
        startTime: new Date().toISOString(),
        duration: 30,
        clientName: 'Test Client',
        notes: 'Meeting created during comprehensive test'
      })
    });
    const meetingTestData = await meetingTestResponse.json();
    logTest('Meeting Webhook Test', 
      meetingTestResponse.ok && meetingTestData.data?.meetingCreated, 
      `Meeting ID: ${meetingTestData.data?.createdMeeting?.id}`
    );

    // Test 5: Test Generic Webhook (ID: 1)
    console.log('\n5️⃣ Testing Generic Webhook...');
    const genericTestResponse = await fetch(`${API_BASE}/api/webhooks/1/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Comprehensive Test Notification',
        message: 'This is a test from the comprehensive test suite'
      })
    });
    const genericTestData = await genericTestResponse.json();
    logTest('Generic Webhook Test', 
      genericTestResponse.ok && genericTestData.data?.received, 
      `Endpoints processed: ${genericTestData.data?.totalEndpoints}`
    );

    // Test 6: Verify Meeting Creation
    console.log('\n6️⃣ Verifying Meeting Creation...');
    const meetingsResponse = await fetch(`${API_BASE}/api/reports/meeting`);
    const meetingsData = await meetingsResponse.json();
    const testMeeting = meetingsData.data?.find(m => m.title === 'Comprehensive Test Meeting');
    logTest('Meeting Creation Verification', 
      !!testMeeting, 
      testMeeting ? `Meeting found with ID: ${testMeeting.id}` : 'Test meeting not found'
    );

    // Test 7: Template Processing Verification
    console.log('\n7️⃣ Verifying Template Processing...');
    const hasSlackTemplate = templatesData.data?.some(t => t.type === 'SLACK' && t.webhookType === 'MEETING');
    const hasTeamsTemplate = templatesData.data?.some(t => t.type === 'TEAMS' && t.webhookType === 'MEETING');
    logTest('Meeting Templates Available', 
      hasSlackTemplate && hasTeamsTemplate, 
      `Slack: ${hasSlackTemplate}, Teams: ${hasTeamsTemplate}`
    );

    // Test 8: Webhook Types Verification
    console.log('\n8️⃣ Verifying Webhook Types...');
    const meetingWebhooks = webhooksData.data?.filter(w => w.type === 'MEETING');
    const genericWebhooks = webhooksData.data?.filter(w => w.type === 'GENERIC');
    logTest('Webhook Types', 
      meetingWebhooks?.length > 0 && genericWebhooks?.length > 0, 
      `Meeting: ${meetingWebhooks?.length}, Generic: ${genericWebhooks?.length}`
    );

    // Test 9: Delivery Results Verification
    console.log('\n9️⃣ Verifying Delivery Results...');
    const deliveryResults = meetingTestData.data?.deliveryResults || [];
    const successfulDeliveries = deliveryResults.filter(r => r.success);
    logTest('Webhook Delivery', 
      deliveryResults.length > 0, 
      `${successfulDeliveries.length}/${deliveryResults.length} successful deliveries`
    );

    // Test 10: Template Variable Replacement
    console.log('\n🔟 Verifying Template Variable Replacement...');
    const processedMessage = deliveryResults.find(r => r.processedMessage)?.processedMessage;
    const hasVariableReplacement = processedMessage && 
      processedMessage.includes('Comprehensive Test Meeting') && 
      processedMessage.includes('Test Client');
    logTest('Template Variable Replacement', 
      hasVariableReplacement, 
      hasVariableReplacement ? 'Variables correctly replaced' : 'Variable replacement failed'
    );

  } catch (error) {
    logTest('Test Suite Execution', false, `Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Webhook functionality is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }

  console.log('\n📋 Test Details:');
  testResults.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.details) console.log(`   ${test.details}`);
  });
}

// Run the comprehensive test
runComprehensiveTest();
