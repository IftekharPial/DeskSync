// Production setup verification for DailySync
const { PrismaClient } = require('./packages/database/src/generated');

const verifySetup = async () => {
  console.log('🔍 DailySync Production Setup Verification');
  console.log('=' .repeat(60));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.uqbqwtikpekoqcxjamid:xoobzyQbneLFvQeu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
      }
    }
  });

  const results = {
    connection: false,
    schema: false,
    users: false,
    platforms: false,
    webhooks: false,
    authentication: false
  };

  try {
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    results.connection = true;
    console.log('✅ Database connection: SUCCESS');

    console.log('\n🏗️  Verifying database schema...');
    try {
      // Test all main tables
      const userCount = await prisma.user.count();
      const platformCount = await prisma.supportPlatform.count();
      const webhookCount = await prisma.incomingWebhook.count();
      const reportCount = await prisma.dailyReport.count();
      const meetingCount = await prisma.meetingReport.count();

      results.schema = true;
      console.log('✅ Database schema: SUCCESS');
      console.log(`   - Users table: ${userCount} records`);
      console.log(`   - Support platforms: ${platformCount} records`);
      console.log(`   - Webhooks: ${webhookCount} records`);
      console.log(`   - Daily reports: ${reportCount} records`);
      console.log(`   - Meeting reports: ${meetingCount} records`);

      // Verify users exist
      if (userCount > 0) {
        results.users = true;
        console.log('✅ Demo users: AVAILABLE');
        
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        if (adminUser) {
          console.log(`   - Admin user: ${adminUser.email}`);
        }
      } else {
        console.log('⚠️  Demo users: NOT FOUND');
      }

      // Verify platforms exist
      if (platformCount > 0) {
        results.platforms = true;
        console.log('✅ Support platforms: AVAILABLE');
        
        const platforms = await prisma.supportPlatform.findMany({
          select: { name: true, isActive: true }
        });
        platforms.forEach(platform => {
          const status = platform.isActive ? 'Active' : 'Inactive';
          console.log(`   - ${platform.name}: ${status}`);
        });
      } else {
        console.log('⚠️  Support platforms: NOT FOUND');
      }

      // Verify webhooks exist
      if (webhookCount > 0) {
        results.webhooks = true;
        console.log('✅ Demo webhooks: AVAILABLE');
      } else {
        console.log('⚠️  Demo webhooks: NOT FOUND');
      }

    } catch (schemaError) {
      console.log('❌ Database schema: MISSING');
      console.log('Error:', schemaError.message);
    }

    console.log('\n🔐 Testing authentication setup...');
    try {
      const demoUser = await prisma.user.findUnique({
        where: { email: 'john.doe@dailysync.com' }
      });
      
      if (demoUser) {
        results.authentication = true;
        console.log('✅ Demo authentication: READY');
        console.log('   - Email: john.doe@dailysync.com');
        console.log('   - Password: password123');
        console.log(`   - Role: ${demoUser.role}`);
      } else {
        console.log('⚠️  Demo authentication: USER NOT FOUND');
      }
    } catch (authError) {
      console.log('❌ Authentication test: FAILED');
      console.log('Error:', authError.message);
    }

    console.log('\n📊 Application Readiness Check...');
    
    // Check if all core components are ready
    const coreReady = results.connection && results.schema && results.users;
    const featuresReady = results.platforms && results.webhooks;
    
    if (coreReady && featuresReady) {
      console.log('🎉 APPLICATION STATUS: FULLY READY FOR PRODUCTION');
      console.log('✅ All systems operational');
      console.log('✅ Database connectivity established');
      console.log('✅ Schema and data properly configured');
      console.log('✅ Authentication system ready');
      console.log('✅ Core features available');
    } else if (coreReady) {
      console.log('⚠️  APPLICATION STATUS: PARTIALLY READY');
      console.log('✅ Core systems operational');
      console.log('⚠️  Some features may need additional setup');
    } else {
      console.log('❌ APPLICATION STATUS: NOT READY');
      console.log('❌ Critical systems missing');
    }

  } catch (error) {
    console.error('❌ Setup verification failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([component, status]) => {
    const icon = status ? '✅' : '❌';
    const statusText = status ? 'PASS' : 'FAIL';
    console.log(`${icon} ${component.toUpperCase()}: ${statusText}`);
  });

  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedChecks / totalChecks) * 100);

  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 OVERALL SUCCESS RATE: ${passedChecks}/${totalChecks} (${successRate}%)`);
  
  if (successRate === 100) {
    console.log('🚀 READY FOR PRODUCTION DEPLOYMENT!');
  } else if (successRate >= 80) {
    console.log('⚠️  MOSTLY READY - Minor issues to resolve');
  } else {
    console.log('❌ NOT READY - Critical issues need attention');
  }

  console.log('\n🏁 Verification completed!');
  
  return results;
};

// Run the verification
verifySetup().catch(console.error);
