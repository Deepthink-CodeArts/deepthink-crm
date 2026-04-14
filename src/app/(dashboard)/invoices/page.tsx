'use client'
// src/app/(dashboard)/invoices/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog, SearchInput } from '@/components/ui'
import { Plus, Trash2, Receipt, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

type LineItem = { id?: string; description: string; quantity: number; unitPrice: number; total?: number }
type Invoice = {
  id: string; number: string; clientName: string; clientEmail?: string
  status: string; dueDate?: string; issuedAt: string
  lineItems: LineItem[]
  deal?: { id: string; title: string }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ clientName:'', clientEmail:'', notes:'', dueDate:'' })
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description:'', quantity:1, unitPrice:0 }])

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setInvoices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  function addLineItem() { setLineItems(items => [...items, { description:'', quantity:1, unitPrice:0 }]) }
  function removeLineItem(i: number) { setLineItems(items => items.filter((_,idx) => idx !== i)) }
  function updateLineItem(i: number, field: keyof LineItem, value: any) {
    setLineItems(items => items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const subtotal = lineItems.reduce((s,i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0)

  async function handleSave() {
    if (!form.clientName.trim()) return toast.error('Client name required')
    if (lineItems.some(i => !i.description.trim())) return toast.error('All line items need a description')
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        clientEmail: form.clientEmail || undefined,
        dueDate: form.dueDate || undefined,
        lineItems: lineItems.map(i => ({ description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success('Invoice created'); setModalOpen(false); setForm({ clientName:'', clientEmail:'', notes:'', dueDate:'' }); setLineItems([{ description:'', quantity:1, unitPrice:0 }]); fetchInvoices() }
    else toast.error('Error')
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    fetchInvoices()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/invoices/${deleteTarget.id}`, { method:'DELETE' })
    toast.success('Deleted'); setDeleteTarget(null); fetchInvoices()
  }

  return (
    <>
      <Header
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={15}/>New Invoice</button>}
      />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices yet" description="Create and send professional invoices to your clients" action={<button onClick={() => setModalOpen(true)} className="btn-primary text-sm"><Plus size={14}/>New Invoice</button>} icon={Receipt}/>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Issued', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const total = inv.lineItems.reduce((s,i) => s + Number(i.total ?? (Number(i.quantity) * Number(i.unitPrice))), 0)
                  return (
                    <tr key={inv.id} className="table-row group">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-brand)' }}>{inv.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.clientName}</p>
                        {inv.clientEmail && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.clientEmail}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(total)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={inv.status}
                          onChange={e => updateStatus(inv.id, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1 border outline-none cursor-pointer"
                          style={{
                            background: 'var(--bg-elevated)',
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="SENT">Sent</option>
                          <option value="PAID">Paid</option>
                          <option value="OVERDUE">Overdue</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: inv.status === 'OVERDUE' ? '#f87171' : 'var(--text-secondary)' }}>
                          {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(inv.issuedAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteTarget(inv)} className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={13}/>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Invoice" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Client Name *</label>
              <input className="input" placeholder="Client or Company" value={form.clientName} onChange={e => setForm(f=>({...f,clientName:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Client Email</label>
              <input className="input" type="email" placeholder="client@email.com" value={form.clientEmail} onChange={e => setForm(f=>({...f,clientEmail:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={e => setForm(f=>({...f,dueDate:e.target.value}))} style={{ width: '200px' }} />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Line Items</label>
              <button onClick={addLineItem} className="btn-secondary text-xs py-1 px-2.5"><Plus size={11}/>Add Item</button>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <th className="px-3 py-2 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Description</th>
                    <th className="px-3 py-2 text-right text-xs font-medium w-20" style={{ color: 'var(--text-muted)' }}>Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium w-28" style={{ color: 'var(--text-muted)' }}>Unit Price</th>
                    <th className="px-3 py-2 text-right text-xs font-medium w-28" style={{ color: 'var(--text-muted)' }}>Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-3 py-2">
                        <input className="w-full bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }} placeholder="Description" value={item.description} onChange={e => updateLineItem(i,'description',e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-full bg-transparent text-sm outline-none text-right" style={{ color: 'var(--text-primary)' }} type="number" min="1" value={item.quantity} onChange={e => updateLineItem(i,'quantity',e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-full bg-transparent text-sm outline-none text-right" style={{ color: 'var(--text-primary)' }} type="number" min="0" value={item.unitPrice} onChange={e => updateLineItem(i,'unitPrice',e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                      </td>
                      <td className="px-1 py-2">
                        {lineItems.length > 1 && (
                          <button onClick={() => removeLineItem(i)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--text-muted)' }}><Trash2 size={11}/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Total</td>
                    <td className="px-3 py-2.5 text-right text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Create Invoice'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete invoice ${deleteTarget?.number}?`} />
    </>
  )
}
