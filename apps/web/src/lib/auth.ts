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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Demo credentials for testing
        const demoUsers = [
          { id: '1', email: 'john.doe@dailysync.com', password: 'password123', name: 'John Doe', role: 'ADMIN' as const },
          { id: '2', email: 'jane.smith@dailysync.com', password: 'password123', name: 'Jane Smith', role: 'USER' as const }
        ]

        const user = demoUsers.find(u => u.email === credentials.email && u.password === credentials.password)

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: true,
          } as User
        }

        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email || ''
        token.name = user.name || ''
        token.role = (user as any).role
        token.isActive = (user as any).isActive
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id
        session.user.email = token.email || ''
        session.user.name = token.name || ''
        ;(session.user as any).role = token.role
        ;(session.user as any).isActive = token.isActive
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
