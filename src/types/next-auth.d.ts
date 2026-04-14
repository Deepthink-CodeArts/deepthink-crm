// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roleId: string
      roleName: string
      permissions: {
        module: string
        canCreate: boolean
        canRead: boolean
        canUpdate: boolean
        canDelete: boolean
      }[]
    } & DefaultSession['user']
  }
}
