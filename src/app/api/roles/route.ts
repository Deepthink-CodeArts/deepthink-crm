// src/app/api/roles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ALL_MODULES = ['CONTACTS','COMPANIES','LEADS','DEALS','PROJECTS','TASKS','INVOICES','USERS','SETTINGS'] as const

const RoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.object({
    module: z.enum(ALL_MODULES),
    canCreate: z.boolean().default(false),
    canRead: z.boolean().default(true),
    canUpdate: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await prisma.role.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(roles)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = RoleSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const role = await prisma.role.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      permissions: { create: parsed.data.permissions },
    },
    include: { permissions: true },
  })
  return NextResponse.json(role, { status: 201 })
}
