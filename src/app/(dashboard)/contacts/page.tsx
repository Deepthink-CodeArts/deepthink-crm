'use client'
// src/app/(dashboard)/contacts/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog, SearchInput, Avatar } from '@/components/ui'
import { Plus, Phone, Mail, MessageCircle, Building2, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type Contact = {
  id: string; name: string; email?: string; phone?: string
  whatsapp?: string; source?: string; roleInCompany?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  company?: { id: string; name: string }
  createdAt: string
}

type Company = { id: string; name: string }

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING'] as const

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [saving, setSaving] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', whatsapp: '',
    source: '', companyId: '', roleInCompany: '', status: 'PENDING' as const, notes: ''
  })

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterStatus) params.set('status', filterStatus)
    const res = await fetch(`/api/contacts?${params}`)
    const data = await res.json()
    setContacts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, filterStatus])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  useEffect(() => {
    fetch('/api/companies').then(r => r.json()).then(d => setCompanies(Array.isArray(d) ? d : []))
  }, [])

  function openAdd() {
    setEditContact(null)
    setForm({ name:'', email:'', phone:'', whatsapp:'', source:'', companyId:'', roleInCompany:'', status:'PENDING', notes:'' })
    setModalOpen(true)
  }

  function openEdit(c: Contact) {
    setEditContact(c)
    setForm({
      name: c.name, email: c.email||'', phone: c.phone||'', whatsapp: c.whatsapp||'',
      source: c.source||'', companyId: c.company?.id||'', roleInCompany: c.roleInCompany||'',
      status: c.status, notes: ''
    })
    setModalOpen(true)
    setOpenMenu(null)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    const url = editContact ? `/api/contacts/${editContact.id}` : '/api/contacts'
    const method = editContact ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, companyId: form.companyId || undefined, email: form.email || undefined })
    })
    setSaving(false)
    if (res.ok) {
      toast.success(editContact ? 'Contact updated' : 'Contact added')
      setModalOpen(false)
      fetchContacts()
    } else {
      toast.error('Something went wrong')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const res = await fetch(`/api/contacts/${deleteTarget.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Contact deleted')
      setDeleteTarget(null)
      fetchContacts()
    }
  }

  return (
    <>
      <Header
        title="Contacts"
        subtitle={`${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={15} /> Add Contact
          </button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search contacts..." />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="select text-sm"
            style={{ width: '140px' }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState
              title="No contacts yet"
              description="Add your first client or prospect contact"
              action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={14} /> Add Contact</button>}
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Company', 'Contact Info', 'Source', 'Status', 'Added', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="table-row group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                          {c.roleInCompany && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.roleInCompany}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.company ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.company.name}</span>
                        </div>
                      ) : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {c.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail size={11} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.phone}</span>
                          </div>
                        )}
                        {c.whatsapp && (
                          <div className="flex items-center gap-1.5">
                            <MessageCircle size={11} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.source || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(c); setOpenMenu(null) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editContact ? 'Edit Contact' : 'Add Contact'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input className="input" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone</label>
              <input className="input" placeholder="+880..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>WhatsApp</label>
              <input className="input" placeholder="+880..." value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Source</label>
              <input className="input" placeholder="Referral, LinkedIn..." value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company</label>
              <select className="select" value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}>
                <option value="">Select company</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role in Company</label>
              <input className="input" placeholder="CEO, Manager..." value={form.roleInCompany} onChange={e => setForm(f => ({ ...f, roleInCompany: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : editContact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </>
  )
}
