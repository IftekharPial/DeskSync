import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Get the pathname of the request (e.g. /, /dashboard, /admin)
    const { pathname } = req.nextUrl

    // Get the token from the request
    const token = req.nextauth.token

    // Allow access to public routes
    if (pathname.startsWith('/login') || pathname === '/') {
      return NextResponse.next()
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', req.url)
        return NextResponse.redirect(loginUrl)
      }

      // Check admin-only routes
      const adminRoutes = ['/dashboard/webhooks', '/dashboard/users', '/dashboard/health', '/dashboard/admin']
      const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
      
      if (isAdminRoute && token.role !== 'ADMIN') {
        // Redirect non-admin users to main dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes without token
        if (pathname.startsWith('/login') || pathname === '/') {
          return true
        }

        // Require token for protected routes
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

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
