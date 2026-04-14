// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const LeadSchema = z.object({
  title: z.string().min(1),
  companyId: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  quality: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  contactIds: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    },
    include: {
      company: { select: { id: true, name: true } },
      contacts: { include: { contact: { select: { id: true, name: true } } } },
      probableDeals: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(leads)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = LeadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { contactIds, ...data } = parsed.data

  const lead = await prisma.lead.create({
    data: {
      ...data,
      companyId: data.companyId || null,
      createdById: session.user.id,
      ...(contactIds?.length && {
        contacts: { create: contactIds.map(id => ({ contactId: id })) }
      }),
    },
    include: {
      company: { select: { id: true, name: true } },
      contacts: { include: { contact: { select: { id: true, name: true } } } },
      probableDeals: true,
    },
  })

  return NextResponse.json(lead, { status: 201 })
}
