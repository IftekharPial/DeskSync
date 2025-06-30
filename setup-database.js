// Database setup script for DailySync
const { PrismaClient } = require('./packages/database/src/generated');

const setupDatabase = async () => {
  console.log('🚀 DailySync Database Setup');
  console.log('=' .repeat(50));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgres://postgres.uqbqwtikpekoqcxjamid:xoobzyQbneLFvQeu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
      }
    }
  });

  try {
    console.log('📡 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    console.log('\n📊 Testing database queries...');
    
    // Test if we can query the database
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log('Database version:', result[0].version);

    console.log('\n🏗️  Checking database schema...');
    
    // Try to query existing tables to see if schema exists
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table exists with ${userCount} records`);
      
      const webhookCount = await prisma.incomingWebhook.count();
      console.log(`✅ Webhooks table exists with ${webhookCount} records`);
      
      const platformCount = await prisma.supportPlatform.count();
      console.log(`✅ Support platforms table exists with ${platformCount} records`);
      
      console.log('\n🎉 Database schema is already set up!');
      
    } catch (schemaError) {
      console.log('ℹ️  Database schema not found - this is expected for new setup');
      console.log('Schema error:', schemaError.message);
      
      console.log('\n⚠️  Manual schema creation required');
      console.log('Please run: pnpm --filter @dailysync/database run db:push');
    }

    console.log('\n📋 Database setup summary:');
    console.log('✅ Connection: Working');
    console.log('✅ Prisma Client: Generated');
    console.log('ℹ️  Schema: Needs manual push if not exists');

  } catch (error) {
    console.error('❌ Database setup failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('💡 Cannot reach database server - check network connectivity');
    } else if (error.code === 'P1002') {
      console.error('💡 Database server unreachable - check server status');
    } else if (error.code === 'P1003') {
      console.error('💡 Database does not exist - check database name');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Database setup completed');
};

// Run the setup
setupDatabase().catch(console.error);
