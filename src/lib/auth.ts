// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            role: {
              include: { permissions: true }
            }
          }
        })

        if (!user || !user.isActive) return null
        if (user.deletedAt) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          roleName: user.role.name,
          permissions: user.role.permissions,
        }
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
