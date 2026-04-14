// src/app/api/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateInvoiceNumber } from '@/lib/utils'

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
})

const InvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional().or(z.literal('')),
  dealId: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(LineItemSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { deletedAt: null },
    include: { lineItems: true, deal: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = InvoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { lineItems, ...data } = parsed.data

  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      number: generateInvoiceNumber(),
      clientEmail: data.clientEmail || null,
      dealId: data.dealId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      lineItems: {
        create: lineItems.map(item => ({
          ...item,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { lineItems: true },
  })
  return NextResponse.json(invoice, { status: 201 })
}
