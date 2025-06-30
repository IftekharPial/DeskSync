// Test environment configuration
// Load .env file manually
const fs = require('fs');
const path = require('path');

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
} catch (error) {
  console.log('⚠️ Could not load .env file');
}

console.log('🔍 Testing Environment Configuration...');
console.log('');

// Test required environment variables
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'REDIS_URL',
  'API_PORT',
  'API_BASE_URL',
  'NODE_ENV'
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allValid = false;
  }
});

console.log('');

if (allValid) {
  console.log('✅ All required environment variables are set');
  
  // Test config package
  try {
    const { env } = require('./packages/config/src/env');
    console.log('✅ Config package loaded successfully');
    console.log(`📊 API Port: ${env.API_PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
  } catch (error) {
    console.log('❌ Config package failed:', error.message);
    allValid = false;
  }
} else {
  console.log('❌ Some environment variables are missing');
}

console.log('');
console.log(allValid ? '🎉 Environment test passed!' : '💥 Environment test failed!');
process.exit(allValid ? 0 : 1);
