import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      )
    }

    const isAdmin = (session as any)?.user?.role === 'ADMIN'

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Generate mock daily reports summary data
    const mockSummary = {
      totalReports: Math.floor(Math.random() * 100) + 50, // 50-150 reports
      completionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      averageScore: parseFloat((Math.random() * 2 + 8).toFixed(1)), // 8.0-10.0
      totalTickets: Math.floor(Math.random() * 500) + 200, // 200-700 tickets
      totalChats: Math.floor(Math.random() * 300) + 150, // 150-450 chats
      totalEmails: Math.floor(Math.random() * 400) + 100, // 100-500 emails
      totalCalls: Math.floor(Math.random() * 200) + 50, // 50-250 calls
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      trends: {
        reports: Math.floor(Math.random() * 20) - 10, // -10 to +10
        completionRate: Math.floor(Math.random() * 10) - 5, // -5 to +5
        averageScore: parseFloat((Math.random() * 1 - 0.5).toFixed(1)), // -0.5 to +0.5
        tickets: Math.floor(Math.random() * 50) - 25, // -25 to +25
        chats: Math.floor(Math.random() * 30) - 15, // -15 to +15
        emails: Math.floor(Math.random() * 40) - 20, // -20 to +20
        calls: Math.floor(Math.random() * 20) - 10 // -10 to +10
      },
      dailyBreakdown: Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        return {
          date: date.toISOString().split('T')[0],
          reports: Math.floor(Math.random() * 10) + 1, // 1-10 reports per day
          completionRate: Math.floor(Math.random() * 20) + 80, // 80-100%
          averageScore: parseFloat((Math.random() * 2 + 8).toFixed(1)), // 8.0-10.0
          tickets: Math.floor(Math.random() * 30) + 5, // 5-35 tickets
          chats: Math.floor(Math.random() * 20) + 3, // 3-23 chats
          emails: Math.floor(Math.random() * 25) + 2, // 2-27 emails
          calls: Math.floor(Math.random() * 15) + 1 // 1-16 calls
        }
      }).reverse() // Most recent first
    }

    // Filter data based on user role
    if (!isAdmin) {
      // For non-admin users, show only their own data
      mockSummary.totalReports = Math.floor(mockSummary.totalReports / 5) // Assume 5 team members
      mockSummary.totalTickets = Math.floor(mockSummary.totalTickets / 5)
      mockSummary.totalChats = Math.floor(mockSummary.totalChats / 5)
      mockSummary.totalEmails = Math.floor(mockSummary.totalEmails / 5)
      mockSummary.totalCalls = Math.floor(mockSummary.totalCalls / 5)
      
      mockSummary.dailyBreakdown = mockSummary.dailyBreakdown.map(day => ({
        ...day,
        reports: Math.floor(day.reports / 5) || 1,
        tickets: Math.floor(day.tickets / 5) || 1,
        chats: Math.floor(day.chats / 5) || 1,
        emails: Math.floor(day.emails / 5) || 1,
        calls: Math.floor(day.calls / 5) || 1
      }))
    }

    return NextResponse.json({
      success: true,
      data: mockSummary
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily reports summary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
