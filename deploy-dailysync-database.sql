-- DailySync Database Deployment Script
-- Complete database setup with schema validation

-- Set client encoding and timezone
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Begin transaction for atomic deployment
BEGIN;

-- Import the complete schema
\i dailysync-complete-schema.sql

-- Import the demo data
\i dailysync-demo-data.sql

-- Validate schema integrity
DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    webhook_count INTEGER;
    template_count INTEGER;
    report_count INTEGER;
BEGIN
    -- Check that all tables were created
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'incoming_webhooks', 'message_templates', 'daily_reports', 'meeting_reports', 'support_platforms');
    
    IF table_count != 6 THEN
        RAISE EXCEPTION 'Schema validation failed: Expected 6 tables, found %', table_count;
    END IF;
    
    -- Check that demo data was inserted
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO webhook_count FROM incoming_webhooks;
    SELECT COUNT(*) INTO template_count FROM message_templates;
    SELECT COUNT(*) INTO report_count FROM daily_reports;
    
    IF user_count < 5 THEN
        RAISE EXCEPTION 'Demo data validation failed: Expected at least 5 users, found %', user_count;
    END IF;
    
    IF webhook_count < 6 THEN
        RAISE EXCEPTION 'Demo data validation failed: Expected at least 6 webhooks, found %', webhook_count;
    END IF;
    
    IF template_count < 5 THEN
        RAISE EXCEPTION 'Demo data validation failed: Expected at least 5 templates, found %', template_count;
    END IF;
    
    IF report_count < 10 THEN
        RAISE EXCEPTION 'Demo data validation failed: Expected at least 10 reports, found %', report_count;
    END IF;
    
    RAISE NOTICE 'Schema validation successful: % tables, % users, % webhooks, % templates, % reports', 
                 table_count, user_count, webhook_count, template_count, report_count;
END $$;

-- Test foreign key relationships
DO $$
DECLARE
    orphaned_webhooks INTEGER;
    orphaned_templates INTEGER;
    orphaned_reports INTEGER;
BEGIN
    -- Check for orphaned webhooks
    SELECT COUNT(*) INTO orphaned_webhooks 
    FROM incoming_webhooks w 
    LEFT JOIN users u ON w."userId" = u.id 
    WHERE u.id IS NULL;
    
    -- Check for orphaned templates
    SELECT COUNT(*) INTO orphaned_templates 
    FROM message_templates t 
    LEFT JOIN incoming_webhooks w ON t."incomingWebhookId" = w.id 
    WHERE w.id IS NULL;
    
    -- Check for orphaned daily reports
    SELECT COUNT(*) INTO orphaned_reports 
    FROM daily_reports r 
    LEFT JOIN users u ON r."userId" = u.id 
    WHERE u.id IS NULL;
    
    IF orphaned_webhooks > 0 THEN
        RAISE EXCEPTION 'Foreign key validation failed: % orphaned webhooks found', orphaned_webhooks;
    END IF;
    
    IF orphaned_templates > 0 THEN
        RAISE EXCEPTION 'Foreign key validation failed: % orphaned templates found', orphaned_templates;
    END IF;
    
    IF orphaned_reports > 0 THEN
        RAISE EXCEPTION 'Foreign key validation failed: % orphaned daily reports found', orphaned_reports;
    END IF;
    
    RAISE NOTICE 'Foreign key validation successful: No orphaned records found';
END $$;

-- Test enum values
DO $$
BEGIN
    -- Test UserRole enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        RAISE EXCEPTION 'UserRole enum not found';
    END IF;
    
    -- Test WebhookStatus enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WebhookStatus') THEN
        RAISE EXCEPTION 'WebhookStatus enum not found';
    END IF;
    
    -- Test MeetingOutcome enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MeetingOutcome') THEN
        RAISE EXCEPTION 'MeetingOutcome enum not found';
    END IF;
    
    RAISE NOTICE 'Enum validation successful: All required enums found';
END $$;

-- Test indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'incoming_webhooks', 'message_templates', 'daily_reports', 'meeting_reports', 'support_platforms');
    
    IF index_count < 10 THEN
        RAISE EXCEPTION 'Index validation failed: Expected at least 10 indexes, found %', index_count;
    END IF;
    
    RAISE NOTICE 'Index validation successful: % indexes found', index_count;
END $$;

-- Create application-specific views for common queries
CREATE OR REPLACE VIEW user_performance_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(dr.id) as total_daily_reports,
    COALESCE(SUM(dr."ticketsResolved"), 0) as total_tickets,
    COALESCE(SUM(dr."chatsHandled"), 0) as total_chats,
    COALESCE(SUM(dr."emailsProcessed"), 0) as total_emails,
    COALESCE(SUM(dr."callsAttended"), 0) as total_calls,
    COALESCE(SUM(dr."githubIssues"), 0) as total_github_issues,
    COUNT(mr.id) as total_meetings,
    COUNT(CASE WHEN mr.outcome = 'COMPLETED' THEN 1 END) as completed_meetings
FROM users u
LEFT JOIN daily_reports dr ON u.id = dr."userId"
LEFT JOIN meeting_reports mr ON u.id = mr."userId"
WHERE u."isActive" = true
GROUP BY u.id, u.name, u.email, u.role;

CREATE OR REPLACE VIEW webhook_activity_summary AS
SELECT 
    w.id,
    w.name,
    w.url,
    w.status,
    u.name as owner_name,
    u.email as owner_email,
    COUNT(t.id) as template_count,
    COUNT(mr.id) as meeting_count,
    COUNT(CASE WHEN mr.outcome = 'COMPLETED' THEN 1 END) as successful_meetings
FROM incoming_webhooks w
JOIN users u ON w."userId" = u.id
LEFT JOIN message_templates t ON w.id = t."incomingWebhookId"
LEFT JOIN meeting_reports mr ON mr."hostId" = u.email
GROUP BY w.id, w.name, w.url, w.status, u.name, u.email;

-- Grant appropriate permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dailysync_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dailysync_app;
-- GRANT SELECT ON user_performance_summary, webhook_activity_summary TO dailysync_app;

-- Commit the transaction
COMMIT;

-- Final validation query
SELECT 
    'Database deployment completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM incoming_webhooks) as webhooks_count,
    (SELECT COUNT(*) FROM message_templates) as templates_count,
    (SELECT COUNT(*) FROM daily_reports) as daily_reports_count,
    (SELECT COUNT(*) FROM meeting_reports) as meeting_reports_count,
    (SELECT COUNT(*) FROM support_platforms) as platforms_count;
