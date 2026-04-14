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
