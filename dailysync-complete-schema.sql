-- DailySync Complete Database Schema
-- Generated to match current Prisma models and application requirements

-- Drop existing tables if they exist (for clean rebuild)
DROP TABLE IF EXISTS "message_templates" CASCADE;
DROP TABLE IF EXISTS "meeting_reports" CASCADE;
DROP TABLE IF EXISTS "daily_reports" CASCADE;
DROP TABLE IF EXISTS "incoming_webhooks" CASCADE;
DROP TABLE IF EXISTS "support_platforms" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "WebhookStatus" CASCADE;
DROP TYPE IF EXISTS "MeetingOutcome" CASCADE;

-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED');
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create support platforms table
CREATE TABLE "support_platforms" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_platforms_pkey" PRIMARY KEY ("id")
);

-- Create incoming webhooks table
CREATE TABLE "incoming_webhooks" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "incoming_webhooks_pkey" PRIMARY KEY ("id")
);

-- Create message templates table
CREATE TABLE "message_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "variables" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "incomingWebhookId" TEXT NOT NULL,
  CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- Create daily reports table
CREATE TABLE "daily_reports" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "ticketsResolved" INTEGER NOT NULL DEFAULT 0,
  "chatsHandled" INTEGER NOT NULL DEFAULT 0,
  "githubIssues" INTEGER NOT NULL DEFAULT 0,
  "emailsProcessed" INTEGER NOT NULL DEFAULT 0,
  "callsAttended" INTEGER NOT NULL DEFAULT 0,
  "platformReports" JSONB,
  "notes" TEXT,
  "links" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  CONSTRAINT "meeting_reports_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
ALTER TABLE "support_platforms" ADD CONSTRAINT "support_platforms_name_key" UNIQUE ("name");
ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_url_key" UNIQUE ("url");
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_userId_date_key" UNIQUE ("userId", "date");

-- Create foreign key constraints
ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_incomingWebhookId_fkey" 
  FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance optimization
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
CREATE INDEX "incoming_webhooks_userId_status_idx" ON "incoming_webhooks"("userId", "status");
CREATE INDEX "incoming_webhooks_status_idx" ON "incoming_webhooks"("status");
CREATE INDEX "message_templates_incomingWebhookId_idx" ON "message_templates"("incomingWebhookId");
CREATE INDEX "daily_reports_userId_date_idx" ON "daily_reports"("userId", "date");
CREATE INDEX "daily_reports_date_idx" ON "daily_reports"("date");
CREATE INDEX "meeting_reports_userId_startTime_idx" ON "meeting_reports"("userId", "startTime");
CREATE INDEX "meeting_reports_startTime_idx" ON "meeting_reports"("startTime");
CREATE INDEX "meeting_reports_outcome_idx" ON "meeting_reports"("outcome");
CREATE INDEX "meeting_reports_hostId_idx" ON "meeting_reports"("hostId");
CREATE INDEX "meeting_reports_isAssigned_idx" ON "meeting_reports"("isAssigned");
CREATE INDEX "support_platforms_isActive_idx" ON "support_platforms"("isActive");

-- Create update triggers for updatedAt fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_platforms_updated_at BEFORE UPDATE ON "support_platforms" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incoming_webhooks_updated_at BEFORE UPDATE ON "incoming_webhooks" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON "message_templates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON "daily_reports" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_reports_updated_at BEFORE UPDATE ON "meeting_reports" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
