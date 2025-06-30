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

    // Mock daily reports data
    const mockData = {
      reportCount: 42,
      completionRate: 95.5,
      averageScore: 8.7,
      trend: 12,
      dailyData: [
        { date: '2024-01-01', reports: 15, completionRate: 100, averageScore: 9.2 },
        { date: '2024-01-02', reports: 18, completionRate: 94, averageScore: 8.8 },
        { date: '2024-01-03', reports: 16, completionRate: 96, averageScore: 9.0 },
        { date: '2024-01-04', reports: 20, completionRate: 90, averageScore: 8.5 },
        { date: '2024-01-05', reports: 14, completionRate: 100, averageScore: 9.3 }
      ]
    }

    return NextResponse.json({
      success: true,
      data: mockData
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Daily reports API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
