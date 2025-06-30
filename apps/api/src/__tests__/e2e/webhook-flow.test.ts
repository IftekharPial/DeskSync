import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../app'
import { testUtils, mockServices } from '../setup'
import { addWebhookDeliveryJob } from '../../services/queue'

describe('Webhook Flow E2E', () => {
  let testAdmin: any
  let adminToken: string
  let webhook: any
  let endpoint: any

  beforeEach(async () => {
    testAdmin = await testUtils.createTestAdmin()
    adminToken = testUtils.generateTestToken(testAdmin.id)
    mockServices.resetMocks()
  })

  afterEach(async () => {
    // Clean up any background jobs
    await testUtils.wait(100)
  })

  describe('Complete Webhook Workflow', () => {
    it('should handle complete webhook creation and delivery flow', async () => {
      // Step 1: Create incoming webhook
      const webhookData = {
        name: 'Test Integration Webhook',
        description: 'E2E test webhook',
        secret: 'test-secret-123',
        status: 'ACTIVE',
      }

      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(webhookData)
        .expect(201)

      webhook = webhookResponse.body.data
      expect(webhook).toMatchObject({
        name: webhookData.name,
        description: webhookData.description,
        status: 'ACTIVE',
      })
      expect(webhook.url).toMatch(/^https?:\/\/.*\/webhook\/[a-f0-9-]+$/)

      // Step 2: Create outgoing endpoint
      const endpointData = {
        url: 'https://hooks.slack.com/test-endpoint',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        template: JSON.stringify({
          text: 'New daily report: {{ticketsResolved}} tickets resolved',
          channel: '#daily-reports',
        }),
        isActive: true,
      }

      const endpointResponse = await request(app)
        .post(`/api/webhooks/${webhook.id}/endpoints`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(endpointData)
        .expect(201)

      endpoint = endpointResponse.body.data
      expect(endpoint).toMatchObject({
        url: endpointData.url,
        method: 'POST',
        isActive: true,
      })

      // Step 3: Send webhook payload
      const payload = {
        type: 'daily_report_created',
        data: {
          userId: testAdmin.id,
          date: '2024-01-15',
          ticketsResolved: 8,
          chatsHandled: 15,
          notes: 'Great day!',
        },
        timestamp: new Date().toISOString(),
      }

      const webhookDeliveryResponse = await request(app)
        .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
        .set('X-Webhook-Secret', webhookData.secret)
        .send(payload)
        .expect(200)

      expect(webhookDeliveryResponse.body).toMatchObject({
        success: true,
        message: 'Webhook received and queued for processing',
      })

      // Step 4: Wait for queue processing
      await testUtils.wait(500)

      // Step 5: Verify delivery logs were created
      const logsResponse = await request(app)
        .get(`/api/webhooks/${webhook.id}/logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(logsResponse.body.data.data).toHaveLength(1)
      const payloadLog = logsResponse.body.data.data[0]
      expect(payloadLog).toMatchObject({
        incomingWebhookId: webhook.id,
        payload: payload,
        status: 'PROCESSED',
      })

      // Step 6: Verify delivery to endpoint was attempted
      const deliveryLogsResponse = await request(app)
        .get(`/api/webhooks/${webhook.id}/endpoints/${endpoint.id}/logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(deliveryLogsResponse.body.data.data).toHaveLength(1)
      const deliveryLog = deliveryLogsResponse.body.data.data[0]
      expect(deliveryLog).toMatchObject({
        outgoingEndpointId: endpoint.id,
        status: 'SUCCESS',
        responseStatus: 200,
      })

      // Verify mock was called
      expect(mockServices.mockWebhookDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.objectContaining({
            id: endpoint.id,
            url: endpointData.url,
          }),
          payload: payload,
        })
      )
    })

    it('should handle webhook delivery failures gracefully', async () => {
      // Setup webhook and endpoint
      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Failure Test Webhook',
          status: 'ACTIVE',
        })
        .expect(201)

      webhook = webhookResponse.body.data

      const endpointResponse = await request(app)
        .post(`/api/webhooks/${webhook.id}/endpoints`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          url: 'https://invalid-endpoint.example.com/webhook',
          method: 'POST',
          isActive: true,
        })
        .expect(201)

      endpoint = endpointResponse.body.data

      // Mock delivery failure
      mockServices.mockWebhookDelivery.mockRejectedValueOnce(
        new Error('Connection timeout')
      )

      // Send webhook payload
      const payload = {
        type: 'test_event',
        data: { test: true },
        timestamp: new Date().toISOString(),
      }

      await request(app)
        .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
        .send(payload)
        .expect(200)

      // Wait for queue processing
      await testUtils.wait(500)

      // Verify failure was logged
      const deliveryLogsResponse = await request(app)
        .get(`/api/webhooks/${webhook.id}/endpoints/${endpoint.id}/logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(deliveryLogsResponse.body.data.data).toHaveLength(1)
      const deliveryLog = deliveryLogsResponse.body.data.data[0]
      expect(deliveryLog).toMatchObject({
        status: 'FAILED',
        errorMessage: 'Connection timeout',
      })
    })

    it('should validate webhook signatures', async () => {
      // Create webhook with secret
      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Signature Test Webhook',
          secret: 'super-secret-key',
          status: 'ACTIVE',
        })
        .expect(201)

      webhook = webhookResponse.body.data

      const payload = {
        type: 'test_event',
        data: { test: true },
      }

      // Test with invalid signature
      await request(app)
        .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
        .set('X-Webhook-Secret', 'wrong-secret')
        .send(payload)
        .expect(401)

      // Test with correct signature
      await request(app)
        .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
        .set('X-Webhook-Secret', 'sha256=super-secret-key')
        .send(payload)
        .expect(200)
    })

    it('should handle inactive webhooks', async () => {
      // Create inactive webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Inactive Webhook',
          status: 'INACTIVE',
        })
        .expect(201)

      webhook = webhookResponse.body.data

      const payload = {
        type: 'test_event',
        data: { test: true },
      }

      // Should reject requests to inactive webhook
      await request(app)
        .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
        .send(payload)
        .expect(404) // Or appropriate error for inactive webhook
    })

    it('should provide webhook analytics', async () => {
      // Create webhook and endpoint
      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Analytics Test Webhook',
          status: 'ACTIVE',
        })
        .expect(201)

      webhook = webhookResponse.body.data

      await request(app)
        .post(`/api/webhooks/${webhook.id}/endpoints`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          url: 'https://example.com/webhook',
          method: 'POST',
          isActive: true,
        })
        .expect(201)

      // Send multiple webhook payloads
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
          .send({
            type: 'test_event',
            data: { iteration: i },
            timestamp: new Date().toISOString(),
          })
          .expect(200)
      }

      // Wait for processing
      await testUtils.wait(500)

      // Get webhook analytics
      const analyticsResponse = await request(app)
        .get('/api/analytics/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(analyticsResponse.body.data).toMatchObject({
        systemStats: expect.objectContaining({
          totalDeliveries: expect.any(Number),
          successfulDeliveries: expect.any(Number),
          successRate: expect.any(Number),
        }),
        webhooks: expect.arrayContaining([
          expect.objectContaining({
            id: webhook.id,
            name: webhook.name,
          }),
        ]),
      })
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on webhook endpoints', async () => {
      // Create webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rate Limit Test Webhook',
          status: 'ACTIVE',
        })
        .expect(201)

      webhook = webhookResponse.body.data

      const payload = { type: 'test_event', data: {} }

      // Send requests rapidly to trigger rate limit
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post(webhook.url.replace(/^https?:\/\/[^\/]+/, ''))
          .send(payload)
      )

      const responses = await Promise.all(requests)

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })
})
