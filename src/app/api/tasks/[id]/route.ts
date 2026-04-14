// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { assigneeIds, ...data } = body

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      ...(assigneeIds !== undefined && {
        assignees: { set: assigneeIds.map((id: string) => ({ id })) }
      }),
    },
    include: { assignees: { select: { id: true, name: true } } },
  })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.task.update({ where: { id: params.id }, data: { deletedAt: new Date() } })
  return NextResponse.json({ success: true })
}
