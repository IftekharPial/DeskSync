import { execSync } from 'child_process'
import { env } from '@dailysync/config'

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...')

  // Ensure test database exists
  try {
    const testDbUrl = env.TEST_DATABASE_URL || env.DATABASE_URL
    console.log('📊 Setting up test database...')
    
    // Create test database if it doesn't exist
    execSync('npx prisma db push --force-reset', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
    })
    
    console.log('✅ Test database ready')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }

  // Setup test Redis
  try {
    console.log('🔴 Setting up test Redis...')
    // Redis setup is handled in individual tests
    console.log('✅ Test Redis ready')
  } catch (error) {
    console.error('❌ Failed to setup test Redis:', error)
    throw error
  }

  console.log('✅ Test environment setup complete')
}
