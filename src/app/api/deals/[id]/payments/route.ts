// src/app/api/deals/[id]/payments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PaymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  paidAt: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = PaymentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const payment = await prisma.payment.create({
    data: {
      ...parsed.data,
      dealId: params.id,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
    },
  })

  // Update amountReceived on deal
  const all = await prisma.payment.aggregate({
    where: { dealId: params.id },
    _sum: { amount: true },
  })
  await prisma.deal.update({
    where: { id: params.id },
    data: { amountReceived: all._sum.amount ?? 0 },
  })

  return NextResponse.json(payment, { status: 201 })
}
