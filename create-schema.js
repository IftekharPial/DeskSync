// Manual database schema creation for DailySync
const { PrismaClient } = require('./packages/database/src/generated');

const createSchema = async () => {
  console.log('🏗️  DailySync Manual Schema Creation');
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

    console.log('\n🏗️  Creating database schema...');

    // Create the schema using raw SQL based on the Prisma schema
    const createTablesSQL = `
      -- Create enum types
      CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
      CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');
      CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'RETRYING');
      CREATE TYPE "MeetingOutcome" AS ENUM ('COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

      -- Create users table
      CREATE TABLE "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'USER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      -- Create support platforms table
      CREATE TABLE "support_platforms" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "support_platforms_pkey" PRIMARY KEY ("id")
      );

      -- Create incoming webhooks table
      CREATE TABLE "incoming_webhooks" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "incoming_webhooks_pkey" PRIMARY KEY ("id")
      );

      -- Create daily reports table
      CREATE TABLE "daily_reports" (
        "id" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "ticketsResolved" INTEGER NOT NULL DEFAULT 0,
        "chatsHandled" INTEGER NOT NULL DEFAULT 0,
        "githubIssues" INTEGER NOT NULL DEFAULT 0,
        "emailsProcessed" INTEGER NOT NULL DEFAULT 0,
        "callsAttended" INTEGER NOT NULL DEFAULT 0,
        "platformReports" JSONB,
        "notes" TEXT,
        "links" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
      );

      -- Create meeting reports table
      CREATE TABLE "meeting_reports" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3),
        "outcome" "MeetingOutcome" NOT NULL,
        "notes" TEXT,
        "attendees" TEXT[],
        "actionItems" TEXT[],
        "customerName" TEXT,
        "customerEmail" TEXT,
        "hostId" TEXT,
        "isAssigned" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT,
        CONSTRAINT "meeting_reports_pkey" PRIMARY KEY ("id")
      );

      -- Create other necessary tables (simplified for core functionality)
      CREATE TABLE "endpoints" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "method" TEXT NOT NULL DEFAULT 'POST',
        "headers" JSONB,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "incomingWebhookId" TEXT NOT NULL,
        CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "message_templates" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "template" TEXT NOT NULL,
        "variables" TEXT[],
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "incomingWebhookId" TEXT NOT NULL,
        CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "payload_logs" (
        "id" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "incomingWebhookId" TEXT NOT NULL,
        CONSTRAINT "payload_logs_pkey" PRIMARY KEY ("id")
      );

      CREATE TABLE "delivery_logs" (
        "id" TEXT NOT NULL,
        "status" "DeliveryStatus" NOT NULL,
        "response" TEXT,
        "deliveredAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "payloadLogId" TEXT NOT NULL,
        "endpointId" TEXT NOT NULL,
        CONSTRAINT "delivery_logs_pkey" PRIMARY KEY ("id")
      );

      -- Create unique constraints
      ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
      ALTER TABLE "support_platforms" ADD CONSTRAINT "support_platforms_name_key" UNIQUE ("name");
      ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_url_key" UNIQUE ("url");

      -- Create foreign key constraints
      ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_incomingWebhookId_fkey" FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_incomingWebhookId_fkey" FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "payload_logs" ADD CONSTRAINT "payload_logs_incomingWebhookId_fkey" FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_payloadLogId_fkey" FOREIGN KEY ("payloadLogId") REFERENCES "payload_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    `;

    console.log('📝 Executing schema creation SQL...');
    await prisma.$executeRawUnsafe(createTablesSQL);
    console.log('✅ Database schema created successfully!');

    console.log('\n🧪 Testing schema...');
    const userCount = await prisma.user.count();
    const platformCount = await prisma.supportPlatform.count();
    console.log(`✅ Users table: ${userCount} records`);
    console.log(`✅ Support platforms table: ${platformCount} records`);

    console.log('\n🎉 Database schema setup completed successfully!');

  } catch (error) {
    console.error('❌ Schema creation failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Schema already exists - this is fine!');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Schema creation completed');
};

// Run the schema creation
createSchema().catch(console.error);
