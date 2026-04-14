'use client'
// src/app/(dashboard)/deals/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog, SearchInput } from '@/components/ui'
import { Plus, DollarSign, Pencil, Trash2, ChevronDown, ChevronUp, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

type Payment = { id: string; amount: number; method?: string; paidAt: string; note?: string }
type Deal = {
  id: string; title: string; status: string
  totalAmount: number; amountReceived: number
  contacts: { contact: { id: string; name: string } }[]
  companies: { company: { id: string; name: string } }[]
  payments: Payment[]
  projects: { id: string; title: string; status: string }[]
  createdAt: string
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [payModal, setPayModal] = useState<Deal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ title:'', totalAmount:'', notes:'' })
  const [payForm, setPayForm] = useState({ amount:'', method:'', reference:'', note:'' })

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/deals')
    const data = await res.json()
    setDeals(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function handleSave() {
    if (!form.title || !form.totalAmount) return toast.error('Fill required fields')
    setSaving(true)
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, totalAmount: parseFloat(form.totalAmount) }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Deal created'); setModalOpen(false); setForm({ title:'', totalAmount:'', notes:'' }); fetchDeals() }
    else toast.error('Error')
  }

  async function handlePayment() {
    if (!payModal || !payForm.amount) return toast.error('Amount required')
    const res = await fetch(`/api/deals/${payModal.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }),
    })
    if (res.ok) { toast.success('Payment recorded'); setPayModal(null); setPayForm({ amount:'', method:'', reference:'', note:'' }); fetchDeals() }
    else toast.error('Error')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/deals/${deleteTarget.id}`, { method:'DELETE' })
    toast.success('Deal deleted'); setDeleteTarget(null); fetchDeals()
  }

  return (
    <>
      <Header
        title="Deals"
        subtitle={`${deals.length} deal${deals.length !== 1 ? 's' : ''}`}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={15}/>New Deal</button>}
      />
      <div className="p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : deals.length === 0 ? (
          <EmptyState title="No deals yet" description="Deals are created when a Lead's probable deal is marked Won, or manually here" action={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={14}/>New Deal</button>}/>
        ) : deals.map(deal => {
          const due = Number(deal.totalAmount) - Number(deal.amountReceived)
          const pct = deal.totalAmount > 0 ? (Number(deal.amountReceived) / Number(deal.totalAmount)) * 100 : 0

          return (
            <div key={deal.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{deal.title}</h3>
                    <Badge status={deal.status as any} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {deal.contacts.slice(0,2).map(c => (
                      <span key={c.contact.id} className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.contact.name}</span>
                    ))}
                    {deal.companies.slice(0,1).map(c => (
                      <span key={c.company.id} className="text-xs" style={{ color: 'var(--text-muted)' }}>· {c.company.name}</span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(deal.totalAmount)}</p>
                  <p className="text-xs" style={{ color: due > 0 ? '#f87171' : '#34d399' }}>
                    {due > 0 ? `${formatCurrency(due)} due` : 'Fully paid'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setPayModal(deal) }} className="btn-secondary text-xs py-1 px-2.5">
                    <CreditCard size={12}/> Payment
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteTarget(deal) }} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}><Trash2 size={13}/></button>
                  {expanded === deal.id ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }}/>}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Payment Progress</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#10B981' : '#3B82F6' }} />
                </div>
              </div>

              {/* Expanded */}
              {expanded === deal.id && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="grid grid-cols-2 gap-6 pt-4">
                    {/* Payment History */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Payment History</p>
                      {deal.payments.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No payments yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {deal.payments.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
                              <div>
                                <p className="text-xs font-medium" style={{ color: '#34d399' }}>{formatCurrency(p.amount)}</p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.method || 'Bank Transfer'} · {formatDate(p.paidAt)}</p>
                              </div>
                              {p.note && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linked Projects */}
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Linked Projects</p>
                      {deal.projects.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No projects linked</p>
                      ) : (
                        <div className="space-y-1.5">
                          {deal.projects.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-overlay)' }}>
                              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                              <Badge status={p.status as any} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* New Deal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Deal" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input className="input" placeholder="Deal title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Total Amount *</label>
            <input className="input" type="number" placeholder="10000" value={form.totalAmount} onChange={e => setForm(f=>({...f,totalAmount:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Create Deal'}</button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm">
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Deal: <strong style={{ color: 'var(--text-primary)' }}>{payModal?.title}</strong></p>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount *</label>
            <input className="input" type="number" placeholder="2500" value={payForm.amount} onChange={e => setPayForm(f=>({...f,amount:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Method</label>
            <input className="input" placeholder="Bank Transfer, bKash..." value={payForm.method} onChange={e => setPayForm(f=>({...f,method:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reference / Note</label>
            <input className="input" placeholder="TXN-12345" value={payForm.reference} onChange={e => setPayForm(f=>({...f,reference:e.target.value}))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setPayModal(null)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handlePayment} className="btn-primary text-sm">Record Payment</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Deal" message={`Delete "${deleteTarget?.title}"?`} />
    </>
  )
}
