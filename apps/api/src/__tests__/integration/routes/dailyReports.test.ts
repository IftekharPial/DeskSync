import { describe, it, expect, beforeEach } from '@jest/globals'
import request from 'supertest'
import { app } from '../../../app'
import { testUtils, factories } from '../../setup'

describe('Daily Reports API', () => {
  let testUser: any
  let testAdmin: any
  let userToken: string
  let adminToken: string

  beforeEach(async () => {
    testUser = await testUtils.createTestUser()
    testAdmin = await testUtils.createTestAdmin()
    userToken = testUtils.generateTestToken(testUser.id)
    adminToken = testUtils.generateTestToken(testAdmin.id)
  })

  describe('POST /api/daily-reports', () => {
    it('should create a daily report successfully', async () => {
      const reportData = {
        date: '2024-01-15',
        ticketsResolved: 5,
        chatsHandled: 10,
        githubIssues: 2,
        emailsProcessed: 15,
        callsAttended: 3,
        notes: 'Test notes',
      }

      const response = await request(app)
        .post('/api/daily-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reportData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          userId: testUser.id,
          date: '2024-01-15T00:00:00.000Z',
          ticketsResolved: 5,
          chatsHandled: 10,
          githubIssues: 2,
          emailsProcessed: 15,
          callsAttended: 3,
          notes: 'Test notes',
        },
      })
      expect(response.body.data.id).toBeValidUUID()
    })

    it('should require authentication', async () => {
      const reportData = factories.dailyReport(testUser.id)

      await request(app)
        .post('/api/daily-reports')
        .send(reportData)
        .expect(401)
    })

    it('should validate request body', async () => {
      const invalidData = {
        date: 'invalid-date',
        ticketsResolved: -1,
      }

      const response = await request(app)
        .post('/api/daily-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Validation failed')
    })

    it('should prevent duplicate reports for same date', async () => {
      const reportData = {
        date: '2024-01-15',
        ticketsResolved: 5,
        chatsHandled: 10,
        githubIssues: 2,
        emailsProcessed: 15,
        callsAttended: 3,
      }

      // Create first report
      await request(app)
        .post('/api/daily-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reportData)
        .expect(201)

      // Try to create duplicate
      const response = await request(app)
        .post('/api/daily-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reportData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('already exists')
    })
  })

  describe('GET /api/daily-reports', () => {
    beforeEach(async () => {
      // Create test reports
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17']
      for (const date of dates) {
        await testUtils.createTestDailyReport(testUser.id, {
          date: new Date(date),
        })
      }
    })

    it('should get user\'s daily reports', async () => {
      const response = await request(app)
        .get('/api/daily-reports')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          data: expect.arrayContaining([
            expect.objectContaining({
              userId: testUser.id,
            }),
          ]),
          pagination: {
            page: 1,
            limit: 10,
            total: 3,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      })
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/daily-reports?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.data).toHaveLength(2)
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      })
    })

    it('should support date filtering', async () => {
      const response = await request(app)
        .get('/api/daily-reports?startDate=2024-01-16&endDate=2024-01-16')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.data).toHaveLength(1)
      expect(response.body.data.data[0].date).toBe('2024-01-16T00:00:00.000Z')
    })

    it('should only return user\'s own reports', async () => {
      const anotherUser = await testUtils.createTestUser({
        email: 'another@example.com',
      })
      const anotherToken = testUtils.generateTestToken(anotherUser.id)

      const response = await request(app)
        .get('/api/daily-reports')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200)

      expect(response.body.data.data).toHaveLength(0)
    })
  })

  describe('GET /api/daily-reports/:id', () => {
    it('should get daily report by id', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)

      const response = await request(app)
        .get(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: report.id,
          userId: testUser.id,
        },
      })
    })

    it('should return 404 for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await request(app)
        .get(`/api/daily-reports/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it('should not allow access to other user\'s reports', async () => {
      const anotherUser = await testUtils.createTestUser({
        email: 'another@example.com',
      })
      const report = await testUtils.createTestDailyReport(anotherUser.id)

      await request(app)
        .get(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })
  })

  describe('PUT /api/daily-reports/:id', () => {
    it('should update daily report successfully', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)
      const updateData = {
        ticketsResolved: 10,
        notes: 'Updated notes',
      }

      const response = await request(app)
        .put(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: report.id,
          ticketsResolved: 10,
          notes: 'Updated notes',
        },
      })
    })

    it('should validate update data', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)
      const invalidData = {
        ticketsResolved: -1,
      }

      const response = await request(app)
        .put(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await request(app)
        .put(`/api/daily-reports/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ticketsResolved: 5 })
        .expect(404)
    })
  })

  describe('DELETE /api/daily-reports/:id', () => {
    it('should delete daily report successfully', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)

      await request(app)
        .delete(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Verify report is deleted
      await request(app)
        .get(`/api/daily-reports/${report.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it('should return 404 for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await request(app)
        .delete(`/api/daily-reports/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })
  })

  describe('GET /api/daily-reports/stats', () => {
    beforeEach(async () => {
      // Create test reports
      const reports = [
        { date: '2024-01-15', ticketsResolved: 5, chatsHandled: 10 },
        { date: '2024-01-16', ticketsResolved: 3, chatsHandled: 8 },
        { date: '2024-01-17', ticketsResolved: 7, chatsHandled: 12 },
      ]

      for (const reportData of reports) {
        await testUtils.createTestDailyReport(testUser.id, {
          date: new Date(reportData.date),
          ticketsResolved: reportData.ticketsResolved,
          chatsHandled: reportData.chatsHandled,
        })
      }
    })

    it('should get daily report stats', async () => {
      const response = await request(app)
        .get('/api/daily-reports/stats?days=30')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          period: {
            days: 30,
          },
          totals: {
            tickets: 15,
            chats: 30,
          },
          averages: {
            tickets: 5,
            chats: 10,
          },
          reportCount: 3,
        },
      })
    })

    it('should support custom date range', async () => {
      const response = await request(app)
        .get('/api/daily-reports/stats?startDate=2024-01-16&endDate=2024-01-16')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.data.reportCount).toBe(1)
      expect(response.body.data.totals.tickets).toBe(3)
    })
  })
})
