// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Authorize attempt for:', credentials?.email)
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }).safeParse(credentials)

        if (!parsed.success) {
          console.log('[AUTH] Parsing failed for:', credentials?.email)
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            role: {
              include: { permissions: true }
            }
          }
        })

        if (!user) {
          console.log('[AUTH] User not found or connection error for:', parsed.data.email)
          return null
        }

        if (!user.isActive) {
          console.log('[AUTH] User is inactive:', parsed.data.email)
          return null
        }

        if (user.deletedAt) {
          console.log('[AUTH] User is soft-deleted:', parsed.data.email)
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) {
          console.log('[AUTH] Password invalid for:', parsed.data.email)
          return null
        }

        const authUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          permissions: user.role.permissions,
        }
        console.log('[AUTH] Login successful for:', authUser.email)
        return authUser
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roleId = (user as any).roleId
        token.roleName = (user as any).roleName
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.roleId = token.roleId as string
      session.user.roleName = token.roleName as string
      session.user.permissions = token.permissions as any
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
})
