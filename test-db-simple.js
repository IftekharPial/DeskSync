// Simple database connection test
const { PrismaClient } = require('./packages/database/src/generated');

const testConnection = async () => {
  console.log('🔗 Testing Supabase Database Connection...');
  
  const prisma = new PrismaClient();

  try {
    console.log('📡 Attempting connection...');
    await prisma.$connect();
    console.log('✅ Connection successful!');

    console.log('📊 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);

    console.log('🏗️  Testing schema...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
      
      const platformCount = await prisma.supportPlatform.count();
      console.log(`✅ Support platforms table exists with ${platformCount} records`);
      
      console.log('🎉 Database is fully operational!');
      return true;
    } catch (schemaError) {
      console.log('⚠️  Schema issue:', schemaError.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
};

testConnection().then(success => {
  if (success) {
    console.log('\n🚀 Database is ready for production!');
  } else {
    console.log('\n⚠️  Database needs attention');
  }
}).catch(console.error);
