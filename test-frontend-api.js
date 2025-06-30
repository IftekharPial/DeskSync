// Test frontend API response structure
async function testFrontendApi() {
  console.log('🔍 Testing Frontend API Response Structure\n');

  const API_BASE = 'http://localhost:3001';

  try {
    // Test the exact API call that the frontend makes
    console.log('1️⃣ Testing /api/webhooks endpoint...');
    const response = await fetch(`${API_BASE}/api/webhooks?page=1&limit=10`);
    const data = await response.json();
    
    console.log('✅ Raw API Response:');
    console.log('Status:', response.status);
    console.log('Response structure:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📋 Response Analysis:');
    console.log('- success:', data.success);
    console.log('- data (array):', Array.isArray(data.data));
    console.log('- data length:', data.data?.length);
    console.log('- pagination:', !!data.pagination);
    
    if (data.data && data.data.length > 0) {
      console.log('\n🔍 First webhook structure:');
      const firstWebhook = data.data[0];
      console.log('- id:', firstWebhook.id);
      console.log('- name:', firstWebhook.name);
      console.log('- url:', firstWebhook.url);
      console.log('- status:', firstWebhook.status);
      console.log('- type:', firstWebhook.type);
      console.log('- description:', firstWebhook.description);
      console.log('- createdAt:', firstWebhook.createdAt);
      
      console.log('\n🎯 Expected frontend access patterns:');
      console.log('- response.data.data (webhooks array):', data.data);
      console.log('- response.data.pagination:', data.pagination);
      console.log('- webhook.url:', firstWebhook.url);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Test individual webhook
    console.log('\n2️⃣ Testing individual webhook endpoint...');
    const webhookResponse = await fetch(`${API_BASE}/api/webhooks/1`);
    const webhookData = await webhookResponse.json();
    
    console.log('✅ Individual Webhook Response:');
    console.log('Status:', webhookResponse.status);
    console.log('Structure:');
    console.log(JSON.stringify(webhookData, null, 2));
    
    if (webhookData.data) {
      console.log('\n🔍 Individual webhook details:');
      console.log('- id:', webhookData.data.id);
      console.log('- name:', webhookData.data.name);
      console.log('- url:', webhookData.data.url);
      console.log('- Complete URL:', `${API_BASE}${webhookData.data.url}`);
    }
    
  } catch (error) {
    console.log('❌ Error testing API:', error.message);
  }
}

// Run the test
testFrontendApi();
