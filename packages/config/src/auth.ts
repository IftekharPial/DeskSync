import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';
import { ExtendedUser, ExtendedSession, ExtendedJWT } from './types';
import { env } from './env';

// JWT utilities
export const signJWT = (payload: any, expiresIn: string = '7d'): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

export const verifyJWT = (token: string): any => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // This will be implemented in the API layer
          // For now, we'll return null to indicate failed authentication
          // The actual authentication logic will be in the API routes
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    secret: env.JWT_SECRET,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }): Promise<ExtendedJWT> {
      if (user) {
        // User is available during sign-in
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.email = extendedUser.email;
        token.name = extendedUser.name;
        token.role = extendedUser.role;
        token.isActive = extendedUser.isActive;
      }
      return token as ExtendedJWT;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedToken = token as ExtendedJWT;
      const extendedSession: ExtendedSession = {
        ...session,
        user: {
          id: extendedToken.id,
          email: extendedToken.email,
          name: extendedToken.name,
          role: extendedToken.role,
          isActive: extendedToken.isActive,
        },
      };
      return extendedSession;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', { userId: user.id, email: user.email });
    },
    async signOut({ session, token }) {
      console.log('User signed out:', { userId: token?.sub });
    },
  },
  debug: env.NODE_ENV === 'development',
};

// Role-based access control utilities
export const hasRole = (user: ExtendedUser | null, requiredRole: string): boolean => {
  if (!user || !user.isActive) return false;
  
  // Admin has access to everything
  if (user.role === 'ADMIN') return true;
  
  // Check specific role
  return user.role === requiredRole;
};

export const isAdmin = (user: ExtendedUser | null): boolean => {
  return hasRole(user, 'ADMIN');
};

export const isSupportAgent = (user: ExtendedUser | null): boolean => {
  return hasRole(user, 'SUPPORT_AGENT');
};

export const canAccessResource = (
  user: ExtendedUser | null,
  resourceUserId?: string
): boolean => {
  if (!user || !user.isActive) return false;
  
  // Admin can access all resources
  if (user.role === 'ADMIN') return true;
  
  // Support agents can only access their own resources
  if (user.role === 'SUPPORT_AGENT') {
    return !resourceUserId || user.id === resourceUserId;
  }
  
  return false;
};

// Middleware helper for role checking
export const requireAuth = (requiredRole?: string) => {
  return (user: ExtendedUser | null) => {
    if (!user || !user.isActive) {
      throw new Error('Authentication required');
    }
    
    if (requiredRole && !hasRole(user, requiredRole)) {
      throw new Error('Insufficient permissions');
    }
    
    return user;
  };
};

// API key utilities (for webhook authentication)
export const generateApiKey = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return `ds_${timestamp}_${random}`;
};

export const validateApiKey = (apiKey: string): boolean => {
  // Basic validation - starts with 'ds_' and has correct format
  const pattern = /^ds_\d+_[a-z0-9]+$/;
  return pattern.test(apiKey);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Session utilities
export const getSessionUser = (session: ExtendedSession | null): ExtendedUser | null => {
  return session?.user || null;
};

export const isSessionValid = (session: ExtendedSession | null): boolean => {
  return !!(session?.user?.id && session.user.isActive);
};
