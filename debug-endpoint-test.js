#!/usr/bin/env node

/**
 * Debug script to test the endpoint test functionality directly
 * Run with: node debug-endpoint-test.js
 */

async function debugEndpointTest() {
  console.log('🔍 Debugging Endpoint Test Functionality...\n');

  const API_BASE = 'http://localhost:3000';

  try {
    // Step 1: Test if the API route exists
    console.log('1️⃣ Testing if endpoint test API route exists...');
    
    // First, let's try to get webhooks to find an endpoint ID
    const webhooksResponse = await fetch(`${API_BASE}/api/webhooks`);
    
    if (!webhooksResponse.ok) {
      console.log('❌ Failed to get webhooks list');
      console.log(`   Status: ${webhooksResponse.status}`);
      const errorText = await webhooksResponse.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }

    const webhooksData = await webhooksResponse.json();
    console.log(`✅ Found ${webhooksData.data?.length || 0} webhooks`);

    if (!webhooksData.data || webhooksData.data.length === 0) {
      console.log('⚠️  No webhooks found - cannot test endpoints');
      return false;
    }

    // Step 2: Get endpoints for the first webhook
    const webhook = webhooksData.data[0];
    console.log(`\n2️⃣ Getting endpoints for webhook: ${webhook.name} (${webhook.id})`);
    
    const endpointsResponse = await fetch(`${API_BASE}/api/webhooks/${webhook.id}/endpoints`);
    
    if (!endpointsResponse.ok) {
      console.log('❌ Failed to get endpoints');
      console.log(`   Status: ${endpointsResponse.status}`);
      const errorText = await endpointsResponse.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }

    const endpointsData = await endpointsResponse.json();
    console.log(`✅ Found ${endpointsData.data?.length || 0} endpoints`);

    if (!endpointsData.data || endpointsData.data.length === 0) {
      console.log('⚠️  No endpoints found to test');
      return false;
    }

    // Step 3: Test the endpoint test API directly
    const endpoint = endpointsData.data[0];
    console.log(`\n3️⃣ Testing endpoint test API for: ${endpoint.name} (${endpoint.id})`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   Method: ${endpoint.method}`);
    console.log(`   Active: ${endpoint.isActive}`);
    
    const testPayload = {
      test: true,
      message: 'Debug test from script',
      timestamp: new Date().toISOString()
    };
    
    console.log(`   Payload: ${JSON.stringify(testPayload, null, 2)}`);
    
    const testResponse = await fetch(`${API_BASE}/api/endpoints/${endpoint.id}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`\n📊 Test API Response:`);
    console.log(`   Status: ${testResponse.status} ${testResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(testResponse.headers.entries()));
    
    const responseText = await testResponse.text();
    console.log(`   Raw Response: ${responseText}`);
    
    let testResult;
    try {
      testResult = JSON.parse(responseText);
      console.log(`   Parsed Response:`, JSON.stringify(testResult, null, 2));
    } catch (parseError) {
      console.log(`   ❌ Failed to parse response as JSON:`, parseError.message);
      return false;
    }
    
    if (testResponse.ok) {
      console.log('\n✅ Endpoint test API is working!');
      if (testResult.data?.success) {
        console.log(`   ✅ Endpoint responded successfully in ${testResult.data.duration}ms`);
      } else {
        console.log(`   ⚠️ Endpoint test completed but endpoint returned error: ${testResult.data?.error}`);
      }
      return true;
    } else {
      console.log('\n❌ Endpoint test API failed');
      console.log(`   Error: ${testResult.error || 'Unknown error'}`);
      return false;
    }

  } catch (error) {
    console.log('\n❌ Debug test failed with exception');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Main function
async function main() {
  const result = await debugEndpointTest();
  
  console.log('\n🎯 Debug Summary:');
  if (result) {
    console.log('✅ Endpoint test functionality appears to be working at the API level');
    console.log('   If the UI is still not working, the issue is likely in the frontend');
  } else {
    console.log('❌ Endpoint test functionality has issues at the API level');
    console.log('   Check the server logs for more details');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Check browser DevTools Network tab when clicking Test button');
  console.log('   2. Check browser console for JavaScript errors');
  console.log('   3. Check server console for the detailed logs we added');
  console.log('   4. Verify authentication is working in the browser');
}

// Run the debug test
main().catch(console.error);
