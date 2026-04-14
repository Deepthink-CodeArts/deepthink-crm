// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
  deadline: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  projectId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const projectId = searchParams.get('projectId')
  const dealId = searchParams.get('dealId')

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      ...(status && { status: status as any }),
      ...(projectId && { projectId }),
      ...(dealId && { dealId }),
    },
    include: {
      assignees: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: [{ urgency: 'desc' }, { deadline: 'asc' }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = TaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { assigneeIds, ...data } = parsed.data
  const task = await prisma.task.create({
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
      contactId: data.contactId || null,
      leadId: data.leadId || null,
      dealId: data.dealId || null,
      projectId: data.projectId || null,
      ...(assigneeIds?.length && { assignees: { connect: assigneeIds.map(id => ({ id })) } }),
    },
    include: {
      assignees: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json(task, { status: 201 })
}
