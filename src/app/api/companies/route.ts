// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CompanySchema = z.object({
  name: z.string().min(1),
  size: z.enum(['SOLO','SMALL','MEDIUM','LARGE','ENTERPRISE']).optional(),
  industry: z.string().optional(),
  areaOfWork: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    },
    include: { _count: { select: { contacts: true, leads: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(companies)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CompanySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const company = await prisma.company.create({
    data: parsed.data,
    include: { _count: { select: { contacts: true, leads: true } } },
  })
  return NextResponse.json(company, { status: 201 })
}
