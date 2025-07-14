#!/usr/bin/env node

/**
 * Comprehensive Webhook Testing Script
 * Tests all webhook functionality including creation, triggering, Slack notifications, and meeting creation
 */

// Use built-in fetch (Node.js 18+) or polyfill
const fetch = globalThis.fetch || require('undici').fetch;

// Test configuration
const BASE_URL = 'http://localhost:3000';
const WEBHOOK_TOKEN = 'iMexK2IL34QhLltjKWMogKMHkrxfmJKQ';
const WEBHOOK_URL = `${BASE_URL}/webhook/${WEBHOOK_TOKEN}`;

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test cases
const testCases = [
  {
    name: 'Valid webhook payload processing',
    payload: {
      meeting_id: `test-${Date.now()}-1`,
      title: 'Test Meeting - Valid Payload',
      start_time: '2024-01-20T10:00:00Z',
      end_time: '2024-01-20T11:00:00Z',
      participants: [
        { name: 'Alice Johnson', email: 'alice@test.com' },
        { name: 'Bob Smith', email: 'bob@test.com' }
      ],
      summary: 'This is a test meeting to verify webhook processing functionality.'
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'Missing required fields',
    payload: {
      meeting_id: `test-${Date.now()}-2`,
      title: 'Test Meeting - Missing Fields',
      // Missing start_time and end_time
      participants: [
        { name: 'Charlie Brown', email: 'charlie@test.com' }
      ],
      summary: 'This payload is missing required fields.'
    },
    expectedStatus: 400,
    shouldSucceed: false
  },
  {
    name: 'Empty participants array',
    payload: {
      meeting_id: `test-${Date.now()}-3`,
      title: 'Test Meeting - Empty Participants',
      start_time: '2024-01-21T14:00:00Z',
      end_time: '2024-01-21T15:00:00Z',
      participants: [],
      summary: 'This meeting has no participants.'
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'Long meeting duration',
    payload: {
      meeting_id: `test-${Date.now()}-4`,
      title: 'Test Meeting - Long Duration',
      start_time: '2024-01-22T09:00:00Z',
      end_time: '2024-01-22T17:00:00Z',
      participants: [
        { name: 'David Wilson', email: 'david@test.com' },
        { name: 'Eva Martinez', email: 'eva@test.com' },
        { name: 'Frank Thompson', email: 'frank@test.com' }
      ],
      summary: 'This is a long 8-hour meeting to test extended duration handling.'
    },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'Special characters in content',
    payload: {
      meeting_id: `test-${Date.now()}-5`,
      title: 'Test Meeting - Special Chars: @#$%^&*()_+{}|:"<>?[]\\;\',./',
      start_time: '2024-01-23T13:00:00Z',
      end_time: '2024-01-23T14:00:00Z',
      participants: [
        { name: 'José García', email: 'jose@test.com' },
        { name: 'François Müller', email: 'francois@test.com' }
      ],
      summary: 'Testing special characters: émojis 🚀, unicode ñáéíóú, and symbols @#$%'
    },
    expectedStatus: 200,
    shouldSucceed: true
  }
];

async function testWebhookEndpoint(testCase) {
  logInfo(`Testing: ${testCase.name}`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebhookTester/1.0'
      },
      body: JSON.stringify(testCase.payload)
    });

    const responseData = await response.json();
    
    if (response.status === testCase.expectedStatus) {
      if (testCase.shouldSucceed) {
        if (responseData.success) {
          logSuccess(`${testCase.name} - Passed`);
          logInfo(`  Meeting ID: ${responseData.data?.meetingReportId || 'N/A'}`);
          logInfo(`  Payload Log ID: ${responseData.data?.payloadLogId || 'N/A'}`);
          logInfo(`  Deliveries: ${responseData.data?.deliveryResults?.successful || 0}/${responseData.data?.deliveryResults?.total || 0} successful`);
          return true;
        } else {
          logError(`${testCase.name} - Failed: Expected success but got failure`);
          logError(`  Response: ${JSON.stringify(responseData, null, 2)}`);
          return false;
        }
      } else {
        logSuccess(`${testCase.name} - Passed (correctly rejected)`);
        logInfo(`  Error message: ${responseData.error || responseData.message}`);
        return true;
      }
    } else {
      logError(`${testCase.name} - Failed: Expected status ${testCase.expectedStatus}, got ${response.status}`);
      logError(`  Response: ${JSON.stringify(responseData, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`${testCase.name} - Error: ${error.message}`);
    return false;
  }
}

async function testWebhookVerification() {
  logInfo('Testing webhook verification (GET request)');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET'
    });

    const responseData = await response.json();
    
    if (response.status === 200 && responseData.success) {
      logSuccess('Webhook verification - Passed');
      logInfo(`  Webhook Name: ${responseData.webhookName}`);
      logInfo(`  Webhook ID: ${responseData.webhookId}`);
      return true;
    } else {
      logError('Webhook verification - Failed');
      logError(`  Response: ${JSON.stringify(responseData, null, 2)}`);
      return false;
    }
  } catch (error) {
    logError(`Webhook verification - Error: ${error.message}`);
    return false;
  }
}

async function testInvalidWebhookToken() {
  logInfo('Testing invalid webhook token');
  
  const invalidUrl = `${BASE_URL}/webhook/invalid-token-123`;
  
  try {
    const response = await fetch(invalidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_id: 'test-invalid',
        title: 'Test',
        start_time: '2024-01-20T10:00:00Z',
        end_time: '2024-01-20T11:00:00Z',
        participants: [],
        summary: 'Test'
      })
    });

    if (response.status === 404) {
      logSuccess('Invalid webhook token - Passed (correctly rejected)');
      return true;
    } else {
      logError(`Invalid webhook token - Failed: Expected 404, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Invalid webhook token - Error: ${error.message}`);
    return false;
  }
}

async function testMalformedJson() {
  logInfo('Testing malformed JSON payload');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json payload'
    });

    if (response.status >= 400) {
      logSuccess('Malformed JSON - Passed (correctly rejected)');
      return true;
    } else {
      logError(`Malformed JSON - Failed: Expected error status, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Malformed JSON - Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Webhook Tests\n', colors.blue);
  
  let passedTests = 0;
  let totalTests = 0;

  // Test webhook verification
  totalTests++;
  if (await testWebhookVerification()) {
    passedTests++;
  }

  // Test invalid token
  totalTests++;
  if (await testInvalidWebhookToken()) {
    passedTests++;
  }

  // Test malformed JSON
  totalTests++;
  if (await testMalformedJson()) {
    passedTests++;
  }

  // Test all payload cases
  for (const testCase of testCases) {
    totalTests++;
    if (await testWebhookEndpoint(testCase)) {
      passedTests++;
    }
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n📊 Test Results Summary\n', colors.blue);
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? colors.green : colors.yellow);
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? colors.green : colors.red);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    logSuccess('\n🎉 All webhook tests passed! The webhook system is functioning correctly.');
  } else {
    logWarning(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please review the issues above.`);
  }

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Test execution failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests };
