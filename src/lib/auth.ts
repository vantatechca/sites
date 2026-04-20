import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { hash, compare } from 'bcryptjs'
import { authOptions } from '@/lib/auth-options'
import type { UserRole } from '@/types'

/**
 * Get the current server-side session with full typing.
 */
export async function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}

/**
 * Require authentication. Throws if no session exists.
 * Returns the typed session.
 */
export async function requireAuth() {
  const session = await getServerSession()

  if (!session?.user) {
    throw new Error('Authentication required')
  }

  return session
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Throws if not authenticated or the user's role is not in the list.
 */
export async function requireRole(roles: UserRole[]) {
  const session = await requireAuth()

  if (!roles.includes(session.user.role)) {
    throw new Error(
      `Access denied. Required role: ${roles.join(' or ')}`,
    )
  }

  return session
}

/**
 * Require agency-side access (admin, manager, or team_member).
 */
export async function requireAgencyAccess() {
  return requireRole(['admin', 'manager', 'team_member'])
}

/**
 * Require client-side access (client role).
 */
export async function requireClientAccess() {
  return requireRole(['client'])
}

/**
 * Hash a plaintext password using bcrypt (12 salt rounds).
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(password, hashedPassword)
}
