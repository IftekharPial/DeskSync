// Comprehensive test script for DailySync features
// Run with: node test-webhook-receive.js

const baseUrl = 'http://localhost:3000' // Replace with your app URL

// Test webhook receive endpoint
const testWebhookReceive = async () => {
  const webhookId = 'test-webhook-id' // Replace with actual webhook ID

  const testPayload = {
    meeting_id: 'test-meeting-123',
    meeting_title: 'Test Customer Meeting',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
    host_id: 'john.doe@dailysync.com', // Use existing demo user email
    customer_name: 'John Doe',
    customer_email: 'john.doe@customer.com'
  }

  try {
    console.log('🔗 Testing webhook receive endpoint...')
    console.log('Payload:', JSON.stringify(testPayload, null, 2))

    const response = await fetch(`${baseUrl}/api/webhooks/${webhookId}/receive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Webhook-Client/1.0'
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()

    console.log('Response Status:', response.status)
    console.log('Response:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('✅ Webhook receive test successful!')
      return true
    } else {
      console.log('❌ Webhook receive test failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Test error:', error.message)
    return false
  }
}

// Test platform API
const testPlatformAPI = async () => {
  try {
    console.log('\n📊 Testing platform API...')

    // Test getting platforms
    const response = await fetch(`${baseUrl}/api/platforms`)
    const result = await response.json()

    console.log('Platforms Response:', JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('✅ Platform API test successful!')
      return true
    } else {
      console.log('❌ Platform API test failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Platform API test error:', error.message)
    return false
  }
}

// Test admin platform management API (requires authentication)
const testAdminPlatformAPI = async () => {
  try {
    console.log('\n🔐 Testing admin platform API...')

    // Test without authentication (should fail)
    const response = await fetch(`${baseUrl}/api/admin/platforms`)
    const result = await response.json()

    console.log('Admin Platforms Response Status:', response.status)
    console.log('Admin Platforms Response:', JSON.stringify(result, null, 2))

    if (response.status === 401) {
      console.log('✅ Admin platform API properly protected!')
      return true
    } else {
      console.log('❌ Admin platform API security test failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Admin platform API test error:', error.message)
    return false
  }
}

// Test analytics dashboard API
const testAnalyticsAPI = async () => {
  try {
    console.log('\n📈 Testing analytics API...')

    // Test without authentication (should fail)
    const response = await fetch(`${baseUrl}/api/analytics/dashboard`)
    const result = await response.json()

    console.log('Analytics Response Status:', response.status)
    console.log('Analytics Response:', JSON.stringify(result, null, 2))

    if (response.status === 401) {
      console.log('✅ Analytics API properly protected!')
      return true
    } else {
      console.log('❌ Analytics API security test failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Analytics API test error:', error.message)
    return false
  }
}

// Test daily reports API
const testDailyReportsAPI = async () => {
  try {
    console.log('\n📝 Testing daily reports API...')

    // Test without authentication (should fail)
    const response = await fetch(`${baseUrl}/api/reports/daily`)
    const result = await response.json()

    console.log('Daily Reports Response Status:', response.status)
    console.log('Daily Reports Response:', JSON.stringify(result, null, 2))

    if (response.status === 401) {
      console.log('✅ Daily reports API properly protected!')
      return true
    } else {
      console.log('❌ Daily reports API security test failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Daily reports API test error:', error.message)
    return false
  }
}

// Test application health
const testAppHealth = async () => {
  try {
    console.log('\n🏥 Testing application health...')

    // Test if the app is running
    const response = await fetch(`${baseUrl}/`)

    console.log('App Health Status:', response.status)

    if (response.ok) {
      console.log('✅ Application is running!')
      return true
    } else {
      console.log('❌ Application health check failed!')
      return false
    }
  } catch (error) {
    console.error('❌ Application health test error:', error.message)
    console.log('💡 Make sure the application is running on', baseUrl)
    return false
  }
}

// Run comprehensive tests
const runTests = async () => {
  console.log('🧪 Running DailySync Comprehensive Feature Tests\n')
  console.log('=' .repeat(60))

  const results = {
    appHealth: await testAppHealth(),
    platformAPI: await testPlatformAPI(),
    adminPlatformAPI: await testAdminPlatformAPI(),
    analyticsAPI: await testAnalyticsAPI(),
    dailyReportsAPI: await testDailyReportsAPI(),
    webhookReceive: await testWebhookReceive(),
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(60))

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${test}`)
  })

  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length

  console.log('\n' + '=' .repeat(60))
  console.log(`🎯 OVERALL: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! DailySync features are working correctly.')
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.')
  }

  console.log('\n🏁 Tests completed!')
}

// Run if called directly
if (require.main === module) {
  runTests()
}
