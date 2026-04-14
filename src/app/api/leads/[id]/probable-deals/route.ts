// src/app/api/leads/[id]/probable-deals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ProbableDealSchema = z.object({
  description: z.string().min(1),
  amount: z.number().min(0),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  stage: z.enum(['WORKING', 'WON', 'LOST']).default('WORKING'),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ProbableDealSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const pd = await prisma.probableDeal.create({
    data: { ...parsed.data, leadId: params.id },
  })

  // Auto-create Deal if stage is WON
  if (pd.stage === 'WON') {
    const lead = await prisma.lead.findUnique({ where: { id: params.id }, include: { company: true, contacts: true } })
    if (lead) {
      await prisma.deal.create({
        data: {
          title: `${lead.title} — ${pd.description}`,
          totalAmount: pd.amount,
          probableDealId: pd.id,
          createdById: session.user.id,
          ...(lead.contacts.length && {
            contacts: { create: lead.contacts.map(c => ({ contactId: c.contactId })) }
          }),
          ...(lead.companyId && {
            companies: { create: [{ companyId: lead.companyId }] }
          }),
        },
      })
    }
  }

  return NextResponse.json(pd, { status: 201 })
}
