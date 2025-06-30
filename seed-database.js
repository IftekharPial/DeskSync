// Database seeding script for DailySync
const { PrismaClient } = require('./packages/database/src/generated');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  console.log('🌱 DailySync Database Seeding');
  console.log('=' .repeat(50));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.uqbqwtikpekoqcxjamid:xoobzyQbneLFvQeu@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
      }
    }
  });

  try {
    console.log('📡 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');

    console.log('\n🧪 Testing if schema exists...');
    
    try {
      // Test if we can query the users table
      const userCount = await prisma.user.count();
      console.log(`✅ Schema exists! Found ${userCount} users`);
      
      // If schema exists, proceed with seeding
      console.log('\n🌱 Seeding initial data...');
      
      // Create demo user if not exists
      const existingUser = await prisma.user.findUnique({
        where: { email: 'john.doe@dailysync.com' }
      });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('password123', 12);
        const demoUser = await prisma.user.create({
          data: {
            id: 'user_demo_001',
            email: 'john.doe@dailysync.com',
            name: 'John Doe',
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true
          }
        });
        console.log('✅ Created demo user:', demoUser.email);
      } else {
        console.log('ℹ️  Demo user already exists');
      }

      // Create support platforms if not exist
      const platforms = [
        { name: 'Facebook', isActive: true },
        { name: 'YouTube', isActive: true },
        { name: 'Email Support', isActive: true },
        { name: 'Live Chat', isActive: true },
        { name: 'Phone Support', isActive: true }
      ];

      for (const platform of platforms) {
        const existing = await prisma.supportPlatform.findUnique({
          where: { name: platform.name }
        });
        
        if (!existing) {
          await prisma.supportPlatform.create({
            data: {
              id: `platform_${platform.name.toLowerCase().replace(/\s+/g, '_')}`,
              ...platform
            }
          });
          console.log(`✅ Created platform: ${platform.name}`);
        } else {
          console.log(`ℹ️  Platform already exists: ${platform.name}`);
        }
      }

      // Create a demo webhook if not exists
      const existingWebhook = await prisma.incomingWebhook.findFirst({
        where: { name: 'Demo Webhook' }
      });

      if (!existingWebhook) {
        const demoWebhook = await prisma.incomingWebhook.create({
          data: {
            id: 'webhook_demo_001',
            name: 'Demo Webhook',
            url: '/webhook/demo-webhook-url',
            status: 'ACTIVE',
            userId: 'user_demo_001'
          }
        });
        console.log('✅ Created demo webhook:', demoWebhook.name);
      } else {
        console.log('ℹ️  Demo webhook already exists');
      }

      console.log('\n📊 Database summary:');
      const finalUserCount = await prisma.user.count();
      const finalPlatformCount = await prisma.supportPlatform.count();
      const finalWebhookCount = await prisma.incomingWebhook.count();
      
      console.log(`✅ Users: ${finalUserCount}`);
      console.log(`✅ Support Platforms: ${finalPlatformCount}`);
      console.log(`✅ Webhooks: ${finalWebhookCount}`);

      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📋 Demo Credentials:');
      console.log('Email: john.doe@dailysync.com');
      console.log('Password: password123');

    } catch (schemaError) {
      console.log('❌ Schema does not exist yet');
      console.log('Error:', schemaError.message);
      console.log('\n⚠️  Please run the database migration first:');
      console.log('1. Use Supabase SQL Editor to create the schema');
      console.log('2. Or run: pnpm --filter @dailysync/database run db:push');
      console.log('3. Then run this seeding script again');
    }

  } catch (error) {
    console.error('❌ Database seeding failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Database seeding completed');
};

// Run the seeding
seedDatabase().catch(console.error);
