import { type UserRole } from '@/types'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      department: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: UserRole
    department: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    department: string | null
  }
}
