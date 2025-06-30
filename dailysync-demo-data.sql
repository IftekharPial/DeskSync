-- DailySync Demo Data
-- Comprehensive sample data for testing and development

-- Insert demo users (passwords are bcrypt hashed 'password123')
INSERT INTO "users" ("id", "email", "name", "password", "role", "isActive") VALUES
('user_admin_001', 'john.doe@dailysync.com', 'John Doe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'ADMIN', true),
('user_agent_001', 'jane.smith@dailysync.com', 'Jane Smith', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'USER', true),
('user_agent_002', 'mike.johnson@dailysync.com', 'Mike Johnson', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'USER', true),
('user_agent_003', 'sarah.wilson@dailysync.com', 'Sarah Wilson', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'USER', true),
('user_agent_004', 'david.brown@dailysync.com', 'David Brown', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hL8.WuFyG', 'USER', false);

-- Insert support platforms
INSERT INTO "support_platforms" ("id", "name", "isActive") VALUES
('platform_facebook', 'Facebook Support', true),
('platform_youtube', 'YouTube Support', true),
('platform_email', 'Email Support', true),
('platform_live_chat', 'Live Chat Support', true),
('platform_phone', 'Phone Support', true),
('platform_twitter', 'Twitter Support', true),
('platform_instagram', 'Instagram Support', false),
('platform_linkedin', 'LinkedIn Support', true);

-- Insert incoming webhooks
INSERT INTO "incoming_webhooks" ("id", "name", "url", "status", "userId") VALUES
('webhook_meetings_001', 'Calendly Meeting Webhook', '/webhook/calendly-meetings', 'ACTIVE', 'user_admin_001'),
('webhook_meetings_002', 'Zoom Meeting Webhook', '/webhook/zoom-meetings', 'ACTIVE', 'user_agent_001'),
('webhook_support_001', 'Support Ticket Webhook', '/webhook/support-tickets', 'ACTIVE', 'user_admin_001'),
('webhook_slack_001', 'Slack Integration Webhook', '/webhook/slack-notifications', 'ACTIVE', 'user_agent_002'),
('webhook_teams_001', 'Teams Integration Webhook', '/webhook/teams-notifications', 'PAUSED', 'user_agent_003'),
('webhook_test_001', 'Test Webhook', '/webhook/test-endpoint', 'INACTIVE', 'user_admin_001');

-- Insert message templates
INSERT INTO "message_templates" ("id", "name", "template", "variables", "incomingWebhookId") VALUES
('template_meeting_001', 'Meeting Created Notification', 
'🎯 New Meeting Scheduled\n\n📅 **Title:** {{meeting_title}}\n👤 **Customer:** {{customer_name}}\n📧 **Email:** {{customer_email}}\n⏰ **Start Time:** {{start_time}}\n👨‍💼 **Assigned To:** {{assigned_user}}\n\n📝 **Notes:** {{notes}}', 
ARRAY['meeting_title', 'customer_name', 'customer_email', 'start_time', 'assigned_user', 'notes'], 
'webhook_meetings_001'),

('template_meeting_002', 'Zoom Meeting Alert', 
'🔔 Zoom Meeting Alert\n\n**Meeting:** {{meeting_title}}\n**Host:** {{assigned_user}}\n**Time:** {{start_time}}\n**Duration:** {{duration}}\n**Join URL:** {{meeting_url}}', 
ARRAY['meeting_title', 'assigned_user', 'start_time', 'duration', 'meeting_url'], 
'webhook_meetings_002'),

('template_support_001', 'Support Ticket Created', 
'🎫 New Support Ticket\n\n**Ticket ID:** {{ticket_id}}\n**Priority:** {{priority}}\n**Customer:** {{customer_name}}\n**Subject:** {{subject}}\n**Description:** {{description}}\n**Assigned To:** {{assigned_agent}}', 
ARRAY['ticket_id', 'priority', 'customer_name', 'subject', 'description', 'assigned_agent'], 
'webhook_support_001'),

('template_slack_001', 'Slack Daily Summary', 
'📊 Daily Performance Summary\n\n👤 **Agent:** {{agent_name}}\n🎫 **Tickets Resolved:** {{tickets_resolved}}\n💬 **Chats Handled:** {{chats_handled}}\n📧 **Emails Processed:** {{emails_processed}}\n📞 **Calls Attended:** {{calls_attended}}\n🐛 **GitHub Issues:** {{github_issues}}\n\n📝 **Notes:** {{daily_notes}}', 
ARRAY['agent_name', 'tickets_resolved', 'chats_handled', 'emails_processed', 'calls_attended', 'github_issues', 'daily_notes'], 
'webhook_slack_001'),

('template_teams_001', 'Teams Meeting Summary', 
'📋 Meeting Summary\n\n**Title:** {{meeting_title}}\n**Outcome:** {{outcome}}\n**Duration:** {{duration}}\n**Attendees:** {{attendees}}\n**Action Items:** {{action_items}}\n**Next Steps:** {{next_steps}}', 
ARRAY['meeting_title', 'outcome', 'duration', 'attendees', 'action_items', 'next_steps'], 
'webhook_teams_001');

-- Insert daily reports (last 30 days of sample data)
INSERT INTO "daily_reports" ("id", "date", "ticketsResolved", "chatsHandled", "githubIssues", "emailsProcessed", "callsAttended", "platformReports", "notes", "links", "userId") VALUES
-- Jane Smith's reports
('report_daily_001', CURRENT_DATE - INTERVAL '1 day', 8, 15, 3, 12, 5, 
'[{"platform": "Facebook", "tickets": 3, "satisfaction": 4.5}, {"platform": "Email", "tickets": 5, "satisfaction": 4.2}]'::jsonb, 
'Handled complex billing issue for enterprise client. Need to follow up tomorrow.', 
ARRAY['https://github.com/company/repo/issues/123', 'https://docs.company.com/billing-guide'], 
'user_agent_001'),

('report_daily_002', CURRENT_DATE - INTERVAL '2 days', 12, 18, 2, 15, 7, 
'[{"platform": "YouTube", "tickets": 4, "satisfaction": 4.8}, {"platform": "Live Chat", "tickets": 8, "satisfaction": 4.3}]'::jsonb, 
'Great day! Resolved several YouTube monetization issues. Team collaboration was excellent.', 
ARRAY['https://github.com/company/repo/pull/456'], 
'user_agent_001'),

('report_daily_003', CURRENT_DATE - INTERVAL '3 days', 6, 10, 1, 8, 3,
'[{"platform": "Facebook", "tickets": 2, "satisfaction": 4.0}, {"platform": "Phone", "tickets": 4, "satisfaction": 4.6}]'::jsonb,
'Slower day due to training session. Learned new escalation procedures.',
ARRAY[]::text[],
'user_agent_001'),

-- Mike Johnson's reports
('report_daily_004', CURRENT_DATE - INTERVAL '1 day', 10, 20, 4, 18, 6, 
'[{"platform": "Twitter", "tickets": 6, "satisfaction": 4.4}, {"platform": "Email", "tickets": 4, "satisfaction": 4.7}]'::jsonb, 
'Busy day with social media issues. Twitter API changes caused several user problems.', 
ARRAY['https://github.com/company/repo/issues/789', 'https://developer.twitter.com/en/docs/twitter-api'], 
'user_agent_002'),

('report_daily_005', CURRENT_DATE - INTERVAL '2 days', 14, 22, 5, 20, 8, 
'[{"platform": "LinkedIn", "tickets": 8, "satisfaction": 4.9}, {"platform": "Live Chat", "tickets": 6, "satisfaction": 4.5}]'::jsonb, 
'Record day! Helped several businesses with LinkedIn integration issues. Very satisfying.', 
ARRAY['https://github.com/company/repo/issues/101', 'https://github.com/company/repo/issues/102'], 
'user_agent_002'),

-- Sarah Wilson's reports
('report_daily_006', CURRENT_DATE - INTERVAL '1 day', 7, 12, 2, 10, 4, 
'[{"platform": "Phone", "tickets": 7, "satisfaction": 4.8}, {"platform": "Email", "tickets": 3, "satisfaction": 4.3}]'::jsonb, 
'Focused on phone support today. Resolved several complex technical issues.', 
ARRAY['https://docs.company.com/phone-support-guide'], 
'user_agent_003'),

('report_daily_007', CURRENT_DATE - INTERVAL '2 days', 9, 16, 3, 14, 5,
'[{"platform": "Facebook", "tickets": 5, "satisfaction": 4.6}, {"platform": "YouTube", "tickets": 4, "satisfaction": 4.4}]'::jsonb,
'Good balance of platforms today. YouTube creators were particularly appreciative.',
ARRAY['https://github.com/company/repo/issues/201'],
'user_agent_003');

-- Insert meeting reports (sample meetings from webhooks)
INSERT INTO "meeting_reports" ("id", "title", "startTime", "endTime", "outcome", "notes", "attendees", "actionItems", "customerName", "customerEmail", "hostId", "isAssigned", "userId") VALUES
-- Assigned meetings
('meeting_001', 'Product Demo - Acme Corp', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'COMPLETED',
'Great demo session. Client showed strong interest in enterprise features. Need to prepare custom pricing proposal.',
ARRAY['John Smith (Acme Corp)', 'Sarah Johnson (Acme Corp)', 'Jane Smith (DailySync)'],
ARRAY['Prepare enterprise pricing proposal', 'Schedule technical deep-dive session', 'Send product documentation'],
'John Smith', 'john.smith@acmecorp.com', 'jane.smith@dailysync.com', true, 'user_agent_001'),

('meeting_002', 'Support Escalation - TechStart Inc', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', 'COMPLETED',
'Resolved critical integration issue. Customer was very satisfied with the quick resolution.',
ARRAY['Mike Chen (TechStart)', 'Mike Johnson (DailySync)'],
ARRAY['Document solution in knowledge base', 'Create integration troubleshooting guide'],
'Mike Chen', 'mike.chen@techstart.com', 'mike.johnson@dailysync.com', true, 'user_agent_002'),

('meeting_003', 'Onboarding Session - StartupXYZ', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '23 hours', 'COMPLETED',
'Successful onboarding. Customer is excited to start using the platform. Provided comprehensive training.',
ARRAY['Lisa Wang (StartupXYZ)', 'Tom Brown (StartupXYZ)', 'Sarah Wilson (DailySync)'],
ARRAY['Send welcome package', 'Schedule 30-day check-in', 'Provide additional training resources'],
'Lisa Wang', 'lisa.wang@startupxyz.com', 'sarah.wilson@dailysync.com', true, 'user_agent_003'),

('meeting_004', 'Quarterly Business Review - Enterprise Client', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '1 hour', 'COMPLETED',
'Excellent QBR. Client renewed for another year and expressed interest in additional modules.',
ARRAY['Robert Davis (Enterprise)', 'Jennifer Lee (Enterprise)', 'John Doe (DailySync)', 'Jane Smith (DailySync)'],
ARRAY['Prepare renewal contract', 'Schedule module demonstration', 'Plan expansion roadmap'],
'Robert Davis', 'robert.davis@enterprise.com', 'john.doe@dailysync.com', true, 'user_admin_001'),

-- Unassigned meetings (no matching host_id)
('meeting_005', 'Discovery Call - Unknown Prospect', CURRENT_TIMESTAMP - INTERVAL '3 hours', NULL, 'NO_SHOW',
'Prospect did not attend the scheduled call. No prior communication about cancellation.',
ARRAY[]::text[],
ARRAY['Follow up via email', 'Reschedule if interested'],
'Unknown Prospect', 'prospect@unknown.com', 'unknown.host@external.com', false, NULL),

('meeting_006', 'Technical Support - Urgent Issue', CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours', 'COMPLETED',
'Emergency support session. Issue was resolved but needs follow-up monitoring.',
ARRAY['Emergency Contact'],
ARRAY['Monitor system for 24 hours', 'Create incident report'],
'Emergency Contact', 'emergency@client.com', 'external.support@client.com', false, NULL),

-- Cancelled and rescheduled meetings
('meeting_007', 'Product Training - Beta Customer', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, 'CANCELLED',
'Customer requested cancellation due to internal restructuring. Will reschedule in Q2.',
ARRAY[]::text[],
ARRAY['Follow up in Q2', 'Send updated product materials'],
'Beta Customer', 'beta@customer.com', 'jane.smith@dailysync.com', true, 'user_agent_001'),

('meeting_008', 'Integration Planning - TechCorp', CURRENT_TIMESTAMP + INTERVAL '2 hours', NULL, 'RESCHEDULED',
'Meeting rescheduled due to customer emergency. New time to be confirmed.',
ARRAY[]::text[],
ARRAY['Confirm new meeting time', 'Send updated calendar invite'],
'TechCorp Team', 'team@techcorp.com', 'mike.johnson@dailysync.com', true, 'user_agent_002');

-- Additional sample data for analytics
INSERT INTO "daily_reports" ("id", "date", "ticketsResolved", "chatsHandled", "githubIssues", "emailsProcessed", "callsAttended", "platformReports", "notes", "links", "userId") VALUES
-- More historical data for better analytics
('report_daily_008', CURRENT_DATE - INTERVAL '4 days', 11, 19, 3, 16, 6,
'[{"platform": "Facebook", "tickets": 4, "satisfaction": 4.5}, {"platform": "Email", "tickets": 7, "satisfaction": 4.3}]'::jsonb,
'Productive day with good customer feedback.',
ARRAY[]::text[], 'user_agent_001'),

('report_daily_009', CURRENT_DATE - INTERVAL '5 days', 13, 21, 4, 19, 7,
'[{"platform": "YouTube", "tickets": 6, "satisfaction": 4.7}, {"platform": "Live Chat", "tickets": 7, "satisfaction": 4.4}]'::jsonb,
'High volume day but managed well.',
ARRAY['https://github.com/company/repo/issues/301'], 'user_agent_002'),

('report_daily_010', CURRENT_DATE - INTERVAL '6 days', 8, 14, 2, 11, 4,
'[{"platform": "Phone", "tickets": 6, "satisfaction": 4.9}, {"platform": "Twitter", "tickets": 2, "satisfaction": 4.2}]'::jsonb,
'Focus on phone support yielded excellent satisfaction scores.',
ARRAY[]::text[], 'user_agent_003');
