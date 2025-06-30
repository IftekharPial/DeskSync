// Test all critical API endpoints
const http = require('http');

const testEndpoints = [
  // Health checks
  '/api/health',
  '/health',

  // Analytics (all endpoints)
  '/api/analytics/dashboard',
  '/api/analytics/daily-reports',
  '/api/analytics/user-performance',
  '/api/analytics/webhook-analytics',
  '/api/analytics/export',

  // Users
  '/api/users',
  '/api/users/me',

  // Daily Reports (including fixed stats endpoint)
  '/api/reports/daily',
  '/api/reports/daily/stats/summary?days=30',

  // Meeting Reports (previously failing - now fixed)
  '/api/reports/meeting?page=1&limit=5',
  '/api/reports/meeting?page=1&limit=10',
  '/api/reports/meeting/stats/summary?days=30',

  // Webhooks
  '/api/webhooks',

  // Logs and Activity
  '/api/logs',
  '/api/activity',

  // Endpoints (webhook endpoint management)
  '/api/endpoints',
  '/api/endpoints?webhookId=1',
  '/api/endpoints/1',
  '/api/endpoints/1/logs',

  // Settings (newly added)
  '/api/settings',
  '/api/settings/profile',

  // Notifications (newly added)
  '/api/notifications',

  // System stats
  '/api/stats/system'
];

console.log('🧪 Testing DailySync API Endpoints...\n');

let testCount = 0;
let passCount = 0;

function testEndpoint(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3001${path}`, (res) => {
      testCount++;
      if (res.statusCode === 200) {
        console.log(`✅ ${path} - Status: ${res.statusCode}`);
        passCount++;
      } else {
        console.log(`❌ ${path} - Status: ${res.statusCode}`);
      }
      resolve();
    });
    
    req.on('error', (err) => {
      testCount++;
      console.log(`❌ ${path} - Error: ${err.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      testCount++;
      console.log(`❌ ${path} - Timeout`);
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n📊 Test Results:');
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);
  console.log(`Success Rate: ${Math.round((passCount / testCount) * 100)}%`);
  
  if (passCount === testCount) {
    console.log('\n🎉 All API endpoints are working correctly!');
  } else {
    console.log('\n⚠️ Some endpoints need attention.');
  }
}

runTests().catch(console.error);
