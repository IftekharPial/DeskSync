-- Quick fix for PostgreSQL array type casting issues
-- This script addresses the "cannot determine type of empty array" error

-- If you've already run the schema and encountered the error, 
-- you can run this script to insert the corrected demo data

-- Clear any partially inserted data (optional)
-- DELETE FROM meeting_reports;
-- DELETE FROM daily_reports;
-- DELETE FROM message_templates;
-- DELETE FROM incoming_webhooks;
-- DELETE FROM support_platforms;
-- DELETE FROM users;

-- Re-run the corrected demo data
\i dailysync-demo-data.sql

-- Verify the data was inserted correctly
SELECT 
    'Data insertion completed successfully!' as status,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM incoming_webhooks) as webhooks_count,
    (SELECT COUNT(*) FROM message_templates) as templates_count,
    (SELECT COUNT(*) FROM daily_reports) as daily_reports_count,
    (SELECT COUNT(*) FROM meeting_reports) as meeting_reports_count,
    (SELECT COUNT(*) FROM support_platforms) as platforms_count;
