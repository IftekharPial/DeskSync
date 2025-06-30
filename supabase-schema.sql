-- DailySync Database Schema for Supabase
-- Run this in Supabase SQL Editor to create the complete schema

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

-- Create endpoints table
CREATE TABLE "endpoints" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'POST',
  "headers" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "incomingWebhookId" TEXT NOT NULL,
  CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
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

-- Create payload logs table
CREATE TABLE "payload_logs" (
  "id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "incomingWebhookId" TEXT NOT NULL,
  CONSTRAINT "payload_logs_pkey" PRIMARY KEY ("id")
);

-- Create delivery logs table
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
ALTER TABLE "incoming_webhooks" ADD CONSTRAINT "incoming_webhooks_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_incomingWebhookId_fkey" 
  FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_incomingWebhookId_fkey" 
  FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payload_logs" ADD CONSTRAINT "payload_logs_incomingWebhookId_fkey" 
  FOREIGN KEY ("incomingWebhookId") REFERENCES "incoming_webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_payloadLogId_fkey" 
  FOREIGN KEY ("payloadLogId") REFERENCES "payload_logs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_endpointId_fkey" 
  FOREIGN KEY ("endpointId") REFERENCES "endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "daily_reports_userId_date_idx" ON "daily_reports"("userId", "date");
CREATE INDEX "meeting_reports_userId_startTime_idx" ON "meeting_reports"("userId", "startTime");
CREATE INDEX "payload_logs_incomingWebhookId_receivedAt_idx" ON "payload_logs"("incomingWebhookId", "receivedAt");

-- Insert initial data
INSERT INTO "users" ("id", "email", "name", "password", "role", "isActive") VALUES
('user_demo_001', 'john.doe@dailysync.com', 'John Doe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'ADMIN', true),
('user_demo_002', 'jane.smith@dailysync.com', 'Jane Smith', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'USER', true);

-- Insert support platforms
INSERT INTO "support_platforms" ("id", "name", "isActive") VALUES
('platform_facebook', 'Facebook', true),
('platform_youtube', 'YouTube', true),
('platform_email_support', 'Email Support', true),
('platform_live_chat', 'Live Chat', true),
('platform_phone_support', 'Phone Support', true);

-- Insert demo webhook
INSERT INTO "incoming_webhooks" ("id", "name", "url", "status", "userId") VALUES
('webhook_demo_001', 'Demo Webhook', '/webhook/demo-webhook-url', 'ACTIVE', 'user_demo_001');

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
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON "daily_reports" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_reports_updated_at BEFORE UPDATE ON "meeting_reports" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_endpoints_updated_at BEFORE UPDATE ON "endpoints" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON "message_templates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
