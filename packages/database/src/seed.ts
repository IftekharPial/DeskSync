import { prisma } from './index';
import { hashPassword } from './utils';
import { UserRole, WebhookStatus, MeetingOutcome } from './generated';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dailysync.com' },
    update: {},
    create: {
      email: 'admin@dailysync.com',
      name: 'System Administrator',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create support agent users
  const agentPassword = await hashPassword('agent123456');
  const agents = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@dailysync.com' },
      update: {},
      create: {
        email: 'john.doe@dailysync.com',
        name: 'John Doe',
        password: agentPassword,
        role: UserRole.USER,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@dailysync.com' },
      update: {},
      create: {
        email: 'jane.smith@dailysync.com',
        name: 'Jane Smith',
        password: agentPassword,
        role: UserRole.USER,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created support agents:', agents.map(a => a.email).join(', '));

  // Create sample webhook
  const webhook = await prisma.incomingWebhook.create({
    data: {
      name: 'Customer Support Notifications',
      description: 'Webhook for receiving customer support notifications from external systems',
      url: '/webhook/customer-support-notifications',
      secret: 'webhook-secret-key-123',
      status: WebhookStatus.ACTIVE,
      createdBy: admin.id,
    },
  });

  console.log('✅ Created sample webhook:', webhook.name);

  // Create outgoing endpoints for the webhook
  const slackEndpoint = await prisma.outgoingEndpoint.create({
    data: {
      name: 'Slack Support Channel',
      url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      isActive: true,
      retryAttempts: 3,
      retryDelayMs: 1000,
      timeoutMs: 30000,
      incomingWebhookId: webhook.id,
    },
  });

  console.log('✅ Created Slack endpoint:', slackEndpoint.name);

  // Create message template for Slack
  await prisma.messageTemplate.create({
    data: {
      name: 'Slack Support Notification',
      template: JSON.stringify({
        text: 'New support request received',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*New Support Request*\n\n*Customer:* {{customer_name}}\n*Priority:* {{priority}}\n*Subject:* {{subject}}\n*Message:* {{message}}',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Ticket',
                },
                url: '{{ticket_url}}',
              },
            ],
          },
        ],
      }),
      description: 'Template for formatting support notifications in Slack',
      outgoingEndpointId: slackEndpoint.id,
    },
  });

  console.log('✅ Created message template for Slack');

  // Create sample daily reports
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await Promise.all([
    // John's reports
    prisma.dailyReport.create({
      data: {
        date: yesterday,
        ticketsResolved: 12,
        chatsHandled: 8,
        githubIssues: 3,
        emailsProcessed: 15,
        callsAttended: 2,
        notes: 'Handled several complex technical issues today. One escalation required.',
        links: ['https://github.com/company/repo/issues/123', 'https://support.company.com/ticket/456'],
        userId: agents[0].id,
      },
    }),
    prisma.dailyReport.create({
      data: {
        date: twoDaysAgo,
        ticketsResolved: 10,
        chatsHandled: 12,
        githubIssues: 2,
        emailsProcessed: 18,
        callsAttended: 1,
        notes: 'Good day overall. Helped with onboarding new customer.',
        links: ['https://support.company.com/ticket/789'],
        userId: agents[0].id,
      },
    }),
    // Jane's reports
    prisma.dailyReport.create({
      data: {
        date: yesterday,
        ticketsResolved: 15,
        chatsHandled: 10,
        githubIssues: 1,
        emailsProcessed: 20,
        callsAttended: 3,
        notes: 'Busy day with multiple customer calls. Resolved billing issues.',
        links: ['https://support.company.com/ticket/101', 'https://support.company.com/ticket/102'],
        userId: agents[1].id,
      },
    }),
  ]);

  console.log('✅ Created sample daily reports');

  // Create sample meeting reports
  await Promise.all([
    prisma.meetingReport.create({
      data: {
        title: 'Weekly Team Standup',
        startTime: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000), // 9 AM yesterday
        endTime: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000), // 10 AM yesterday
        outcome: MeetingOutcome.SUCCESSFUL,
        notes: 'Discussed current sprint progress and upcoming releases.',
        attendees: ['john.doe@dailysync.com', 'jane.smith@dailysync.com', 'admin@dailysync.com'],
        actionItems: [
          'Update documentation for new API endpoints',
          'Review customer feedback from last week',
          'Prepare demo for stakeholder meeting',
        ],
        userId: agents[0].id,
      },
    }),
    prisma.meetingReport.create({
      data: {
        title: 'Customer Onboarding Call - Acme Corp',
        startTime: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000), // 2 PM yesterday
        endTime: new Date(yesterday.getTime() + 15 * 60 * 60 * 1000), // 3 PM yesterday
        outcome: MeetingOutcome.SUCCESSFUL,
        notes: 'Successful onboarding call. Customer is excited about the platform.',
        attendees: ['jane.smith@dailysync.com', 'customer@acmecorp.com'],
        actionItems: [
          'Send follow-up email with setup instructions',
          'Schedule training session for next week',
          'Create custom integration documentation',
        ],
        userId: agents[1].id,
      },
    }),
  ]);

  console.log('✅ Created sample meeting reports');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Admin user: admin@dailysync.com (password: admin123456)`);
  console.log(`- Support agents: john.doe@dailysync.com, jane.smith@dailysync.com (password: agent123456)`);
  console.log(`- Sample webhook with Slack integration`);
  console.log(`- Sample daily and meeting reports`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
