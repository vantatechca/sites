import { type AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { compare } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import type { UserRole } from '@/types'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Agency Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1)

        if (!user) {
          throw new Error('No account found with that email')
        }

        if (!user.passwordHash) {
          throw new Error('This account uses magic link login')
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated')
        }

        const isValid = await compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          department: user.department,
        }
      },
    }),

    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || 'SiteForge <noreply@siteforge.dev>',
      maxAge: 24 * 60 * 60,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
      }

      if (token.email && !token.role) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1)

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role as UserRole
          token.department = dbUser.department
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.department = token.department
      }
      return session
    },

    async signIn({ user, account }) {
      if (account?.provider === 'email') {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1)

        if (!dbUser || !dbUser.isActive) {
          return false
        }
      }
      return true
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
}
