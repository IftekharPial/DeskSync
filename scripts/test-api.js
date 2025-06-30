#!/usr/bin/env node

/**
 * API Testing Script for DailySync
 * Run with: node scripts/test-api.js
 */

const https = require('http');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let adminToken = '';

// Test configuration
const testConfig = {
  testUser: {
    email: 'test@example.com',
    password: 'password123'
  },
  testAdmin: {
    email: 'admin@example.com',
    password: 'admin123'
  }
};

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test user login
    console.log('  Testing user login...');
    const userLogin = await makeRequest('POST', '/auth/login', testConfig.testUser);
    if (userLogin.status === 200 && userLogin.data.success) {
      authToken = userLogin.data.data.token;
      console.log('  ✅ User login successful');
    } else {
      console.log('  ❌ User login failed:', userLogin.data?.error || 'Unknown error');
    }

    // Test admin login
    console.log('  Testing admin login...');
    const adminLogin = await makeRequest('POST', '/auth/login', testConfig.testAdmin);
    if (adminLogin.status === 200 && adminLogin.data.success) {
      adminToken = adminLogin.data.data.token;
      console.log('  ✅ Admin login successful');
    } else {
      console.log('  ❌ Admin login failed:', adminLogin.data?.error || 'Unknown error');
    }

    // Test invalid login
    console.log('  Testing invalid login...');
    const invalidLogin = await makeRequest('POST', '/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    if (invalidLogin.status === 401) {
      console.log('  ✅ Invalid login properly rejected');
    } else {
      console.log('  ❌ Invalid login not properly handled');
    }

  } catch (error) {
    console.log('  ❌ Authentication test error:', error.message);
  }
}

async function testDailyReports() {
  console.log('\n📊 Testing Daily Reports...');
  
  if (!authToken) {
    console.log('  ❌ No auth token available, skipping daily reports tests');
    return;
  }

  try {
    // Test creating daily report
    console.log('  Testing daily report creation...');
    const reportData = {
      date: new Date().toISOString().split('T')[0],
      ticketsResolved: 5,
      chatsHandled: 10,
      githubIssues: 2,
      emailsProcessed: 15,
      callsAttended: 3,
      notes: 'Test daily report from API testing script'
    };

    const createReport = await makeRequest('POST', '/daily-reports', reportData, authToken);
    if (createReport.status === 201 && createReport.data.success) {
      console.log('  ✅ Daily report created successfully');
      
      // Test getting reports
      console.log('  Testing daily reports retrieval...');
      const getReports = await makeRequest('GET', '/daily-reports', null, authToken);
      if (getReports.status === 200 && getReports.data.success) {
        console.log(`  ✅ Retrieved ${getReports.data.data.data.length} daily reports`);
      } else {
        console.log('  ❌ Failed to retrieve daily reports');
      }

    } else {
      console.log('  ❌ Daily report creation failed:', createReport.data?.error || 'Unknown error');
    }

    // Test duplicate date prevention
    console.log('  Testing duplicate date prevention...');
    const duplicateReport = await makeRequest('POST', '/daily-reports', reportData, authToken);
    if (duplicateReport.status === 409) {
      console.log('  ✅ Duplicate date properly prevented');
    } else {
      console.log('  ❌ Duplicate date not properly handled');
    }

  } catch (error) {
    console.log('  ❌ Daily reports test error:', error.message);
  }
}

async function testMeetingReports() {
  console.log('\n🤝 Testing Meeting Reports...');
  
  if (!authToken) {
    console.log('  ❌ No auth token available, skipping meeting reports tests');
    return;
  }

  try {
    // Test creating meeting report
    console.log('  Testing meeting report creation...');
    const meetingData = {
      title: 'API Test Meeting',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      outcome: 'SUCCESSFUL',
      notes: 'Test meeting from API testing script',
      attendees: ['test1@example.com', 'test2@example.com'],
      actionItems: ['Test action item 1', 'Test action item 2']
    };

    const createMeeting = await makeRequest('POST', '/meeting-reports', meetingData, authToken);
    if (createMeeting.status === 201 && createMeeting.data.success) {
      console.log('  ✅ Meeting report created successfully');
      
      // Test getting meeting reports
      console.log('  Testing meeting reports retrieval...');
      const getMeetings = await makeRequest('GET', '/meeting-reports', null, authToken);
      if (getMeetings.status === 200 && getMeetings.data.success) {
        console.log(`  ✅ Retrieved ${getMeetings.data.data.data.length} meeting reports`);
      } else {
        console.log('  ❌ Failed to retrieve meeting reports');
      }

    } else {
      console.log('  ❌ Meeting report creation failed:', createMeeting.data?.error || 'Unknown error');
    }

  } catch (error) {
    console.log('  ❌ Meeting reports test error:', error.message);
  }
}

async function testWebhooks() {
  console.log('\n🔗 Testing Webhooks (Admin only)...');
  
  if (!adminToken) {
    console.log('  ❌ No admin token available, skipping webhook tests');
    return;
  }

  try {
    // Test creating webhook
    console.log('  Testing webhook creation...');
    const webhookData = {
      name: 'API Test Webhook',
      description: 'Webhook created by API testing script',
      secret: 'test-webhook-secret',
      status: 'ACTIVE'
    };

    const createWebhook = await makeRequest('POST', '/webhooks', webhookData, adminToken);
    if (createWebhook.status === 201 && createWebhook.data.success) {
      console.log('  ✅ Webhook created successfully');
      const webhookId = createWebhook.data.data.id;
      
      // Test adding endpoint
      console.log('  Testing endpoint creation...');
      const endpointData = {
        url: 'https://httpbin.org/post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        template: '{"message": "Test webhook from {{userName}}"}',
        isActive: true
      };

      const createEndpoint = await makeRequest('POST', `/webhooks/${webhookId}/endpoints`, endpointData, adminToken);
      if (createEndpoint.status === 201 && createEndpoint.data.success) {
        console.log('  ✅ Webhook endpoint created successfully');
      } else {
        console.log('  ❌ Webhook endpoint creation failed');
      }

      // Test getting webhooks
      console.log('  Testing webhooks retrieval...');
      const getWebhooks = await makeRequest('GET', '/webhooks', null, adminToken);
      if (getWebhooks.status === 200 && getWebhooks.data.success) {
        console.log(`  ✅ Retrieved ${getWebhooks.data.data.data.length} webhooks`);
      } else {
        console.log('  ❌ Failed to retrieve webhooks');
      }

    } else {
      console.log('  ❌ Webhook creation failed:', createWebhook.data?.error || 'Unknown error');
    }

  } catch (error) {
    console.log('  ❌ Webhooks test error:', error.message);
  }
}

async function testAnalytics() {
  console.log('\n📈 Testing Analytics...');
  
  if (!authToken) {
    console.log('  ❌ No auth token available, skipping analytics tests');
    return;
  }

  try {
    // Test user analytics
    console.log('  Testing user analytics...');
    const userAnalytics = await makeRequest('GET', '/analytics/user-performance?days=30', null, authToken);
    if (userAnalytics.status === 200 && userAnalytics.data.success) {
      console.log('  ✅ User analytics retrieved successfully');
    } else {
      console.log('  ❌ User analytics failed');
    }

    // Test admin analytics (if admin token available)
    if (adminToken) {
      console.log('  Testing admin analytics...');
      const adminAnalytics = await makeRequest('GET', '/analytics/webhooks', null, adminToken);
      if (adminAnalytics.status === 200 && adminAnalytics.data.success) {
        console.log('  ✅ Admin analytics retrieved successfully');
      } else {
        console.log('  ❌ Admin analytics failed');
      }
    }

  } catch (error) {
    console.log('  ❌ Analytics test error:', error.message);
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  try {
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('  ✅ Health check passed');
      console.log('  📊 Health data:', health.data);
    } else {
      console.log('  ❌ Health check failed');
    }
  } catch (error) {
    console.log('  ❌ Health check error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting DailySync API Tests...');
  console.log('📍 API Base URL:', API_BASE);
  
  await testHealthCheck();
  await testAuthentication();
  await testDailyReports();
  await testMeetingReports();
  await testWebhooks();
  await testAnalytics();
  
  console.log('\n✅ API Testing Complete!');
  console.log('\n📝 Test Summary:');
  console.log('   - Health Check: API connectivity');
  console.log('   - Authentication: User and admin login');
  console.log('   - Daily Reports: CRUD operations');
  console.log('   - Meeting Reports: CRUD operations');
  console.log('   - Webhooks: Admin webhook management');
  console.log('   - Analytics: Performance data retrieval');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  makeRequest,
  testAuthentication,
  testDailyReports,
  testMeetingReports,
  testWebhooks,
  testAnalytics,
  testHealthCheck,
  runTests
};
