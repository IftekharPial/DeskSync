import { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req): Promise<User | null> {
        console.log('🔍 NextAuth authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password })

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
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: true,
          } as User
        }

        console.log('❌ Invalid credentials for:', credentials.email)
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
    secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: false, // Disable secure cookies for localhost
  debug: process.env.NODE_ENV === 'development',
  trustHost: true, // Trust the host for localhost development
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
