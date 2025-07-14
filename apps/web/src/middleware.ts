import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default withAuth(
  async function middleware(req) {
    // Get the pathname of the request (e.g. /, /dashboard, /admin)
    const { pathname } = req.nextUrl

    // Get the token from the request
    const token = req.nextauth.token

    // Try to get token manually if withAuth doesn't provide it
    let manualToken = null
    if (!token) {
      try {
        manualToken = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET
        })
      } catch (error) {
        console.log('❌ Manual token retrieval failed:', error)
      }
    }

    const effectiveToken = token || manualToken

    // Debug logging for session validation
    console.log('🔍 Middleware called:', {
      pathname,
      hasToken: !!effectiveToken,
      tokenId: effectiveToken?.id,
      tokenRole: effectiveToken?.role,
      withAuthToken: !!token,
      manualToken: !!manualToken,
      cookies: req.cookies.getAll().map(c => c.name).filter(n => n.includes('next-auth'))
    })

    // Create response with performance headers
    const response = NextResponse.next()

    // Add performance and security headers
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

    // Add caching headers for static assets
    if (pathname.includes('/_next/static/') || pathname.includes('/favicon.ico')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    }

    // Allow access to public routes
    if (pathname.startsWith('/login') || pathname === '/') {
      return response
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!effectiveToken) {
        console.log('❌ Dashboard access denied - no token', { pathname, hasToken: !!effectiveToken })
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(loginUrl)
      }

      console.log('✅ Dashboard access authorized', { pathname, tokenId: effectiveToken.id, role: effectiveToken.role })

      // Check admin-only routes
      const adminRoutes = ['/dashboard/webhooks', '/dashboard/users', '/dashboard/health', '/dashboard/admin']
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

      if (isAdminRoute && effectiveToken.role !== 'ADMIN') {
        console.log('❌ Admin route access denied', { pathname, role: effectiveToken.role })
        // Redirect non-admin users to main dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: async ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Try to get token manually if withAuth doesn't provide it
        let effectiveToken = token
        if (!token) {
          try {
            effectiveToken = await getToken({
              req,
              secret: process.env.NEXTAUTH_SECRET
            })
          } catch (error) {
            console.log('❌ Authorized callback manual token retrieval failed:', error)
          }
        }

        console.log('🔍 Middleware authorized callback:', {
          pathname,
          hasToken: !!effectiveToken,
          tokenId: effectiveToken?.id,
          tokenEmail: effectiveToken?.email,
          withAuthToken: !!token,
          manualToken: !!effectiveToken && !token
        })

        // Allow access to public routes without token
        if (pathname.startsWith('/login') || pathname === '/') {
          console.log('✅ Public route allowed:', pathname)
          return true
        }

        // Require token for protected routes
        if (pathname.startsWith('/dashboard')) {
          const authorized = !!effectiveToken
          console.log(authorized ? '✅ Dashboard access authorized in callback' : '❌ Dashboard access denied in callback - no token', { pathname, hasToken: !!effectiveToken })
          return authorized
        }

        console.log('✅ Other route allowed:', pathname)
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
