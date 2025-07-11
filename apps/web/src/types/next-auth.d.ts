import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique id. */
      id: string
      /** The user's role. */
      role: 'USER' | 'ADMIN'
      /** Whether the user account is active. */
      isActive: boolean
    } & DefaultSession["user"]
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    /** The user's unique id. */
    id: string
    /** The user's role. */
    role: 'USER' | 'ADMIN'
    /** Whether the user account is active. */
    isActive: boolean
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's unique id. */
    id: string
    /** The user's role. */
    role: 'USER' | 'ADMIN'
    /** Whether the user account is active. */
    isActive: boolean
  }
}
