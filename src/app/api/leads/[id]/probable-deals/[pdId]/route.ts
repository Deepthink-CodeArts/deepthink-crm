// src/app/api/leads/[id]/probable-deals/[pdId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; pdId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const previous = await prisma.probableDeal.findUnique({ where: { id: params.pdId } })

  const pd = await prisma.probableDeal.update({
    where: { id: params.pdId },
    data: body,
  })

  // Auto-create Deal when stage changes to WON
  const existingDeal = await prisma.deal.findFirst({ where: { probableDealId: pd.id } })
  if (pd.stage === 'WON' && previous?.stage !== 'WON' && !existingDeal) {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { contacts: true },
    })
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

      // Mark lead as converted
      await prisma.lead.update({
        where: { id: params.id },
        data: { status: 'CONVERTED' },
      })
    }
  }

  return NextResponse.json(pd)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; pdId: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.probableDeal.delete({ where: { id: params.pdId } })
  return NextResponse.json({ success: true })
}
