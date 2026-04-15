import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MeetingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  scheduledAt: z.string().min(1),
  duration: z.number().int().optional(),
  location: z.string().optional(),
  meetUrl: z.string().optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  contactIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meetings = await prisma.meeting.findMany({
    include: {
      createdBy: { select: { id: true, name: true, avatar: true } },
      lead: { select: { id: true, title: true } },
      deal: { select: { id: true, title: true } },
      attendees: { include: { contact: { select: { id: true, name: true } } } }
    },
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json(meetings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = MeetingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { contactIds, ...data } = parsed.data

  const meeting = await prisma.meeting.create({
    data: {
      ...data,
      scheduledAt: new Date(data.scheduledAt),
      createdById: session.user.id,
      leadId: data.leadId || null,
      dealId: data.dealId || null,
      attendees: contactIds?.length ? {
        create: contactIds.map(id => ({
          contact: { connect: { id } }
        }))
      } : undefined
    },
    include: {
      attendees: { include: { contact: { select: { id: true, name: true } } } }
    }
  })
  return NextResponse.json(meeting, { status: 201 })
}
