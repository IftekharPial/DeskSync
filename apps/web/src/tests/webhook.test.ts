import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@dailysync/database';

// Test configuration
const TEST_WEBHOOK_URL = 'http://localhost:3000/webhook/iMexK2IL34QhLltjKWMogKMHkrxfmJKQ';
const TEST_WEBHOOK_ID = 'cmcltn08c00014298eooipj5a';

interface WebhookTestPayload {
  meeting_id: string;
  title: string;
  start_time: string;
  end_time: string;
  participants: Array<{
    name: string;
    email: string;
  }>;
  summary: string;
}

describe('Webhook System End-to-End Tests', () => {
  let testPayloadLogIds: string[] = [];
  let testMeetingReportIds: string[] = [];

  beforeAll(async () => {
    // Ensure test webhook exists and is active
    const webhook = await prisma.incomingWebhook.findUnique({
      where: { id: TEST_WEBHOOK_ID }
    });
    
    if (!webhook) {
      throw new Error('Test webhook not found. Please ensure test data is set up.');
    }
    
    expect(webhook.status).toBe('ACTIVE');
  });

  afterAll(async () => {
    // Clean up test data
    if (testPayloadLogIds.length > 0) {
      await prisma.payloadLog.deleteMany({
        where: { id: { in: testPayloadLogIds } }
      });
    }
    
    if (testMeetingReportIds.length > 0) {
      await prisma.meetingReport.deleteMany({
        where: { id: { in: testMeetingReportIds } }
      });
    }
  });

  describe('Webhook Payload Processing', () => {
    it('should successfully process a valid webhook payload', async () => {
      const testPayload: WebhookTestPayload = {
        meeting_id: `test-${Date.now()}`,
        title: 'Test Meeting for Webhook Processing',
        start_time: '2024-01-20T10:00:00Z',
        end_time: '2024-01-20T11:00:00Z',
        participants: [
          { name: 'Alice Johnson', email: 'alice@test.com' },
          { name: 'Bob Smith', email: 'bob@test.com' }
        ],
        summary: 'This is a test meeting to verify webhook processing functionality.'
      };

      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Webhook processed successfully');
      expect(result.data.webhookId).toBe(TEST_WEBHOOK_ID);
      expect(result.data.payloadLogId).toBeDefined();
      expect(result.data.meetingReportId).toBeDefined();
      
      // Store IDs for cleanup
      testPayloadLogIds.push(result.data.payloadLogId);
      testMeetingReportIds.push(result.data.meetingReportId);
      
      // Verify delivery results
      expect(result.data.deliveryResults.total).toBeGreaterThan(0);
      expect(result.data.deliveryResults.successful).toBeGreaterThan(0);
    });

    it('should reject webhook payload with missing required fields', async () => {
      const invalidPayload = {
        meeting_id: 'test-invalid',
        title: 'Test Meeting',
        // Missing start_time and end_time
        participants: [],
        summary: 'Invalid payload test'
      };

      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload)
      });

      expect(response.status).toBe(400);
      
      const result = await response.json();
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle malformed JSON payload', async () => {
      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Meeting Creation from Webhooks', () => {
    it('should create meeting report with correct data', async () => {
      const testPayload: WebhookTestPayload = {
        meeting_id: `meeting-test-${Date.now()}`,
        title: 'Meeting Creation Test',
        start_time: '2024-01-21T14:00:00Z',
        end_time: '2024-01-21T15:30:00Z',
        participants: [
          { name: 'Charlie Brown', email: 'charlie@test.com' }
        ],
        summary: 'Testing meeting creation from webhook payload.'
      };

      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      testPayloadLogIds.push(result.data.payloadLogId);
      testMeetingReportIds.push(result.data.meetingReportId);

      // Verify meeting report was created correctly
      const meetingReport = await prisma.meetingReport.findUnique({
        where: { id: result.data.meetingReportId }
      });

      expect(meetingReport).toBeDefined();
      expect(meetingReport!.title).toBe(testPayload.title);
      expect(meetingReport!.hostId).toBe(testPayload.meeting_id);
      expect(meetingReport!.customerName).toBe(testPayload.participants[0].name);
      expect(meetingReport!.customerEmail).toBe(testPayload.participants[0].email);
      expect(meetingReport!.notes).toBe(testPayload.summary);
      expect(meetingReport!.outcome).toBe('COMPLETED');
    });
  });

  describe('Webhook Authentication and Security', () => {
    it('should return 404 for invalid webhook token', async () => {
      const invalidUrl = 'http://localhost:3000/webhook/invalid-token-123';
      
      const response = await fetch(invalidUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: 'test',
          title: 'Test',
          start_time: '2024-01-20T10:00:00Z',
          end_time: '2024-01-20T11:00:00Z',
          participants: [],
          summary: 'Test'
        })
      });

      expect(response.status).toBe(404);
      
      const result = await response.json();
      expect(result.error).toBe('Webhook not found or inactive');
    });

    it('should support GET requests for webhook verification', async () => {
      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Webhook endpoint is active');
      expect(result.webhookId).toBe(TEST_WEBHOOK_ID);
    });
  });

  describe('Payload and Delivery Logging', () => {
    it('should log incoming payloads correctly', async () => {
      const testPayload: WebhookTestPayload = {
        meeting_id: `log-test-${Date.now()}`,
        title: 'Payload Logging Test',
        start_time: '2024-01-22T09:00:00Z',
        end_time: '2024-01-22T10:00:00Z',
        participants: [
          { name: 'David Wilson', email: 'david@test.com' }
        ],
        summary: 'Testing payload logging functionality.'
      };

      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Agent/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      testPayloadLogIds.push(result.data.payloadLogId);
      testMeetingReportIds.push(result.data.meetingReportId);

      // Verify payload log was created
      const payloadLog = await prisma.payloadLog.findUnique({
        where: { id: result.data.payloadLogId }
      });

      expect(payloadLog).toBeDefined();
      expect(payloadLog!.incomingWebhookId).toBe(TEST_WEBHOOK_ID);
      expect(payloadLog!.payload).toEqual(testPayload);
      expect(payloadLog!.userAgent).toBe('Test-Agent/1.0');
      expect(payloadLog!.headers).toBeDefined();
    });

    it('should create delivery logs for all active endpoints', async () => {
      const testPayload: WebhookTestPayload = {
        meeting_id: `delivery-test-${Date.now()}`,
        title: 'Delivery Logging Test',
        start_time: '2024-01-23T11:00:00Z',
        end_time: '2024-01-23T12:00:00Z',
        participants: [
          { name: 'Eva Martinez', email: 'eva@test.com' }
        ],
        summary: 'Testing delivery logging functionality.'
      };

      const response = await fetch(TEST_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      testPayloadLogIds.push(result.data.payloadLogId);
      testMeetingReportIds.push(result.data.meetingReportId);

      // Verify delivery logs were created
      const deliveryLogs = await prisma.deliveryLog.findMany({
        where: { payloadLogId: result.data.payloadLogId }
      });

      expect(deliveryLogs.length).toBeGreaterThan(0);
      expect(deliveryLogs.every(log => log.status === 'SUCCESS')).toBe(true);
      expect(deliveryLogs.every(log => log.deliveredAt !== null)).toBe(true);
    });
  });
});
