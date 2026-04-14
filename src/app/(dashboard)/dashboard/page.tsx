// src/app/(dashboard)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'

import { Users, Target, Handshake, FolderKanban, CheckSquare, Receipt, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()

  const [
    contactCount, leadCount, dealCount, projectCount,
    taskCount, invoiceCount, recentTasks, recentLeads,
    totalRevenue, pendingAmount
  ] = await Promise.all([
    prisma.contact.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.deal.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { deletedAt: null, status: { not: 'DONE' } } }),
    prisma.invoice.count({ where: { deletedAt: null } }),
    prisma.task.findMany({
      where: { deletedAt: null, status: { not: 'DONE' } },
      orderBy: { deadline: 'asc' },
      take: 5,
    }),
    prisma.lead.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { company: true },
    }),
    prisma.deal.aggregate({
      where: { deletedAt: null },
      _sum: { amountReceived: true }
    }),
    prisma.deal.aggregate({
      where: { deletedAt: null },
      _sum: { totalAmount: true }
    }),
  ])

  const received = Number(totalRevenue._sum.amountReceived ?? 0)
  const total = Number(pendingAmount._sum.totalAmount ?? 0)

  return (
    <>
      <Header
        title={`Good ${getGreeting()}, ${session?.user.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening across your workspace"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Contacts"  value={contactCount} icon={Users}         color="#3B82F6" />
          <StatCard label="Active Leads"    value={leadCount}    icon={Target}        color="#8B5CF6" />
          <StatCard label="Open Deals"      value={dealCount}    icon={Handshake}     color="#10B981" />
          <StatCard label="Live Projects"   value={projectCount} icon={FolderKanban}  color="#F59E0B" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Tasks"   value={taskCount}    icon={CheckSquare}   color="#EC4899" />
          <StatCard label="Invoices"        value={invoiceCount} icon={Receipt}       color="#06B6D4" />
          <StatCard label="Revenue In"      value={formatCurrency(received)} icon={TrendingUp} color="#10B981" />
          <StatCard label="Total Pipeline"  value={formatCurrency(total)}    icon={TrendingUp} color="#3B82F6" />
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Pending Tasks
              </h2>
              <a href="/tasks" className="text-xs" style={{ color: 'var(--text-brand)' }}>View all →</a>
            </div>
            {recentTasks.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No pending tasks</p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: task.urgency === 'HIGH' ? '#EF4444' : task.urgency === 'MEDIUM' ? '#F59E0B' : '#64748B' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                      {task.deadline && (
                        <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={9} /> Due {formatDate(task.deadline)}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{
                        background: task.urgency === 'HIGH' ? 'rgba(239,68,68,0.15)' : task.urgency === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                        color: task.urgency === 'HIGH' ? '#f87171' : task.urgency === 'MEDIUM' ? '#fbbf24' : '#94a3b8',
                      }}
                    >
                      {task.urgency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Leads */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Leads</h2>
              <a href="/leads" className="text-xs" style={{ color: 'var(--text-brand)' }}>View all →</a>
            </div>
            {recentLeads.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No leads yet</p>
            ) : (
              <div className="space-y-2">
                {recentLeads.map(lead => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: lead.quality === 'HIGH' ? '#10B981' : lead.quality === 'MEDIUM' ? '#F59E0B' : '#64748B' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{lead.title}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{lead.company?.name ?? 'No company'}</p>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: lead.quality === 'HIGH' ? 'rgba(16,185,129,0.15)' : lead.quality === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                        color: lead.quality === 'HIGH' ? '#34d399' : lead.quality === 'MEDIUM' ? '#fbbf24' : '#94a3b8',
                      }}
                    >
                      {lead.quality}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color?: string
  trend?: string
}

function StatCard({ label, value, icon: Icon, color = '#3B82F6', trend }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {trend && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{trend}</p>}
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    </div>
  )
}
