// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  plan: z.string().optional(),
  deadline: z.string().optional(),
  dealId: z.string().optional(),
  memberIds: z.array(z.object({ userId: z.string(), role: z.string().optional() })).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    include: {
      deal: { select: { id: true, title: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { tasks: true, documents: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ProjectSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { memberIds, ...data } = parsed.data
  const project = await prisma.project.create({
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
      dealId: data.dealId || null,
      ...(memberIds?.length && {
        members: { create: memberIds.map(m => ({ userId: m.userId, role: m.role })) },
      }),
    },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { tasks: true } },
    },
  })
  return NextResponse.json(project, { status: 201 })
}
