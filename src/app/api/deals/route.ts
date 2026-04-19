// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const DealSchema = z.object({
  title: z.string().min(1),
  totalAmount: z.number().min(0),
  contactIds: z.array(z.string()).optional(),
  companyIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  business: z.string().optional().nullable(),
  spokespersons: z.string().optional().nullable(),
  understanding: z.string().optional().nullable(),
  opportunity: z.string().optional().nullable(),
  friendliness: z.string().optional().nullable(),
  finance: z.string().optional().nullable(),
  servicePain: z.string().optional().nullable(),
  featurePain: z.string().optional().nullable(),
  timePain: z.string().optional().nullable(),
  paymentDelayPain: z.string().optional().nullable(),
  trustLevel: z.string().optional().nullable(),
  paymentBehavior: z.string().optional().nullable(),
  workStyle: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  lastContact: z.string().transform(str => str ? new Date(str) : null).optional().nullable(),
  nextFollowUp: z.string().transform(str => str ? new Date(str) : null).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const deals = await prisma.deal.findMany({
    where: { deletedAt: null },
    include: {
      contacts: { include: { contact: { select: { id: true, name: true } } } },
      companies: { include: { company: { select: { id: true, name: true } } } },
      payments: true,
      projects: { select: { id: true, title: true, status: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(deals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = DealSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { contactIds, companyIds, ...data } = parsed.data
  const deal = await prisma.deal.create({
    data: {
      ...data,
      createdById: session.user.id,
      ...(contactIds?.length && { contacts: { create: contactIds.map(id => ({ contactId: id })) } }),
      ...(companyIds?.length && { companies: { create: companyIds.map(id => ({ companyId: id })) } }),
    },
    include: {
      contacts: { include: { contact: { select: { id: true, name: true } } } },
      companies: { include: { company: { select: { id: true, name: true } } } },
      payments: true,
    },
  })
  return NextResponse.json(deal, { status: 201 })
}
