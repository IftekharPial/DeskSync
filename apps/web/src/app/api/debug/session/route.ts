import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug session endpoint called')
    
    // Get session using getServerSession
    const session = await getServerSession(authOptions)
    console.log('📋 getServerSession result:', session)
    
    // Get token using getToken
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    console.log('🎫 getToken result:', token)
    
    // Get cookies from request
    const cookies = request.cookies.getAll()
    const nextAuthCookies = cookies.filter(c => c.name.includes('next-auth'))
    console.log('🍪 NextAuth cookies:', nextAuthCookies)
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV
    }
    console.log('🌍 Environment check:', envCheck)
    
    return NextResponse.json({
      success: true,
      data: {
        session,
        token,
        cookies: nextAuthCookies,
        environment: envCheck,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Debug session error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
