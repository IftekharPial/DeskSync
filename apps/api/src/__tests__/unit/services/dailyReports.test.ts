import { describe, it, expect, beforeEach } from '@jest/globals'
import { testUtils, factories } from '../../setup'
import { dailyReportsService } from '../../../services/dailyReports'
import { validationError, notFoundError, conflictError } from '../../../middleware/errorHandler'

describe('DailyReportsService', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = await testUtils.createTestUser()
  })

  describe('createDailyReport', () => {
    it('should create a daily report successfully', async () => {
      const reportData = factories.dailyReport(testUser.id)
      
      const result = await dailyReportsService.createDailyReport(reportData)

      expect(result).toMatchObject({
        userId: testUser.id,
        ticketsResolved: reportData.ticketsResolved,
        chatsHandled: reportData.chatsHandled,
        githubIssues: reportData.githubIssues,
        emailsProcessed: reportData.emailsProcessed,
        callsAttended: reportData.callsAttended,
        notes: reportData.notes,
      })
      expect(result.id).toBeValidUUID()
      expect(result.createdAt).toBeValidDate()
    })

    it('should prevent duplicate reports for the same date', async () => {
      const reportData = factories.dailyReport(testUser.id, {
        date: new Date('2024-01-15'),
      })

      // Create first report
      await dailyReportsService.createDailyReport(reportData)

      // Try to create duplicate
      await expect(
        dailyReportsService.createDailyReport(reportData)
      ).rejects.toThrow(conflictError('Daily report already exists for this date'))
    })

    it('should validate required fields', async () => {
      const invalidData = {
        userId: testUser.id,
        // Missing required fields
      }

      await expect(
        dailyReportsService.createDailyReport(invalidData as any)
      ).rejects.toThrow()
    })

    it('should validate numeric fields are non-negative', async () => {
      const invalidData = factories.dailyReport(testUser.id, {
        ticketsResolved: -1,
      })

      await expect(
        dailyReportsService.createDailyReport(invalidData)
      ).rejects.toThrow()
    })
  })

  describe('getDailyReports', () => {
    beforeEach(async () => {
      // Create test reports
      const dates = ['2024-01-15', '2024-01-16', '2024-01-17']
      for (const date of dates) {
        await testUtils.createTestDailyReport(testUser.id, {
          date: new Date(date),
        })
      }
    })

    it('should get daily reports with pagination', async () => {
      const result = await dailyReportsService.getDailyReports(testUser.id, {
        page: 1,
        limit: 2,
      })

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      })
    })

    it('should filter by date range', async () => {
      const result = await dailyReportsService.getDailyReports(testUser.id, {
        startDate: '2024-01-16',
        endDate: '2024-01-16',
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].date).toEqual(new Date('2024-01-16'))
    })

    it('should return empty array for user with no reports', async () => {
      const anotherUser = await testUtils.createTestUser({
        email: 'another@example.com',
      })

      const result = await dailyReportsService.getDailyReports(anotherUser.id)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getDailyReportById', () => {
    it('should get daily report by id', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)

      const result = await dailyReportsService.getDailyReportById(report.id, testUser.id)

      expect(result).toMatchObject({
        id: report.id,
        userId: testUser.id,
        ticketsResolved: report.ticketsResolved,
      })
    })

    it('should throw error for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await expect(
        dailyReportsService.getDailyReportById(fakeId, testUser.id)
      ).rejects.toThrow(notFoundError('Daily report not found'))
    })

    it('should throw error when accessing another user\'s report', async () => {
      const anotherUser = await testUtils.createTestUser({
        email: 'another@example.com',
      })
      const report = await testUtils.createTestDailyReport(anotherUser.id)

      await expect(
        dailyReportsService.getDailyReportById(report.id, testUser.id)
      ).rejects.toThrow(notFoundError('Daily report not found'))
    })
  })

  describe('updateDailyReport', () => {
    it('should update daily report successfully', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)
      const updateData = {
        ticketsResolved: 10,
        notes: 'Updated notes',
      }

      const result = await dailyReportsService.updateDailyReport(
        report.id,
        testUser.id,
        updateData
      )

      expect(result).toMatchObject({
        id: report.id,
        ticketsResolved: 10,
        notes: 'Updated notes',
      })
    })

    it('should throw error for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await expect(
        dailyReportsService.updateDailyReport(fakeId, testUser.id, {
          ticketsResolved: 5,
        })
      ).rejects.toThrow(notFoundError('Daily report not found'))
    })

    it('should validate update data', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)

      await expect(
        dailyReportsService.updateDailyReport(report.id, testUser.id, {
          ticketsResolved: -1,
        })
      ).rejects.toThrow()
    })
  })

  describe('deleteDailyReport', () => {
    it('should delete daily report successfully', async () => {
      const report = await testUtils.createTestDailyReport(testUser.id)

      await dailyReportsService.deleteDailyReport(report.id, testUser.id)

      // Verify report is deleted
      await expect(
        dailyReportsService.getDailyReportById(report.id, testUser.id)
      ).rejects.toThrow(notFoundError('Daily report not found'))
    })

    it('should throw error for non-existent report', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'

      await expect(
        dailyReportsService.deleteDailyReport(fakeId, testUser.id)
      ).rejects.toThrow(notFoundError('Daily report not found'))
    })
  })

  describe('getDailyReportStats', () => {
    beforeEach(async () => {
      // Create test reports with different dates
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

    it('should calculate stats correctly', async () => {
      const result = await dailyReportsService.getDailyReportStats(testUser.id, {
        days: 30,
      })

      expect(result).toMatchObject({
        period: {
          days: 30,
        },
        totals: {
          tickets: 15, // 5 + 3 + 7
          chats: 30,   // 10 + 8 + 12
        },
        averages: {
          tickets: 5,  // 15 / 3
          chats: 10,   // 30 / 3
        },
        reportCount: 3,
      })
    })

    it('should return zero stats for user with no reports', async () => {
      const anotherUser = await testUtils.createTestUser({
        email: 'another@example.com',
      })

      const result = await dailyReportsService.getDailyReportStats(anotherUser.id, {
        days: 30,
      })

      expect(result.totals.tickets).toBe(0)
      expect(result.averages.tickets).toBe(0)
      expect(result.reportCount).toBe(0)
    })
  })
})
