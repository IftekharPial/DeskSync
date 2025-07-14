import { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Debug environment variables at module load
console.log('🔍 NextAuth config loading:', {
  NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  secretValue: process.env.NEXTAUTH_SECRET?.substring(0, 10) + '...',
  NODE_ENV: process.env.NODE_ENV
})

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req): Promise<User | null> {
        console.log('🔍 NextAuth authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password })
        console.log('🔍 Environment check in authorize:', {
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          secretLength: process.env.NEXTAUTH_SECRET?.length
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // Demo credentials for testing
        const demoUsers = [
          { id: '1', email: 'john.doe@dailysync.com', password: 'password123', name: 'John Doe', role: 'ADMIN' as const },
          { id: '2', email: 'jane.smith@dailysync.com', password: 'password123', name: 'Jane Smith', role: 'USER' as const }
        ]

        const user = demoUsers.find(u => u.email === credentials.email && u.password === credentials.password)

        if (user) {
          console.log('✅ User authenticated:', user.email, user.role)
          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: true,
          } as User
          console.log('✅ Returning user object:', userObject)
          return userObject
        }

        console.log('❌ Invalid credentials for:', credentials.email)
        console.log('❌ Returning null from authorize')
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days for persistent sessions
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Remove duplicate secret - use the main secret from authOptions
  },
  // Remove custom cookie configuration - let NextAuth use defaults
  // This might be causing CSRF validation issues
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🔍 JWT callback called:', { hasUser: !!user, tokenId: token.id, userEmail: user?.email, account: account?.type })
      if (user) {
        // This is the initial sign in
        token.id = user.id
        token.email = user.email || ''
        token.name = user.name || ''
        token.role = (user as any).role
        token.isActive = (user as any).isActive
        console.log('✅ JWT token updated with user data:', { id: token.id, email: token.email, role: token.role })
      }
      return token
    },
    async session({ session, token }) {
      console.log('🔍 Session callback called:', { hasToken: !!token, tokenId: token?.id, sessionUser: !!session.user })
      if (token) {
        // Ensure session.user exists
        if (!session.user) {
          session.user = { name: '', email: '', image: '' }
        }

        // Update session with token data
        (session.user as any).id = token.id
        session.user.email = token.email as string || ''
        session.user.name = token.name as string || ''
        ;(session.user as any).role = token.role
        ;(session.user as any).isActive = token.isActive
        console.log('✅ Session updated with token data:', {
          id: (session.user as any).id,
          email: session.user.email,
          role: (session.user as any).role,
          hasUser: !!session.user
        })
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 NextAuth redirect callback:', { url, baseUrl })

      // If the URL is relative, make it absolute
      if (url.startsWith('/')) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('✅ Redirecting to:', redirectUrl)
        return redirectUrl
      }

      // If the URL is on the same origin, allow it
      if (url.startsWith(baseUrl)) {
        console.log('✅ Same origin redirect to:', url)
        return url
      }

      // Default to dashboard for successful logins
      const defaultUrl = `${baseUrl}/dashboard`
      console.log('✅ Default redirect to dashboard:', defaultUrl)
      return defaultUrl
    },
  },
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user.email)
    },
    async signOut({ token }) {
      console.log('User signed out:', token?.email)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
