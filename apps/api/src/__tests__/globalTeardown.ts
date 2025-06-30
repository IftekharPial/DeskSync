export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')
  
  // Cleanup is handled in individual test files
  // This ensures proper cleanup of database connections and Redis
  
  console.log('✅ Test environment cleanup complete')
}
