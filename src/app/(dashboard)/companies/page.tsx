'use client'
// src/app/(dashboard)/companies/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Modal, EmptyState, ConfirmDialog, SearchInput, Avatar } from '@/components/ui'
import { Plus, Globe, MapPin, Users, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type Company = {
  id: string; name: string; size?: string; industry?: string
  areaOfWork?: string; address?: string; website?: string
  createdAt: string
  _count: { contacts: number; leads: number }
}

const SIZE_OPTIONS = ['SOLO','SMALL','MEDIUM','LARGE','ENTERPRISE']
const SIZE_LABELS: Record<string, string> = {
  SOLO: 'Solo', SMALL: '2–10', MEDIUM: '11–50', LARGE: '51–200', ENTERPRISE: '200+'
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCompany, setEditCompany] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name:'', size:'', industry:'', areaOfWork:'', address:'', website:'', notes:''
  })

  const fetch$ = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/companies?search=${search}`)
    const data = await res.json()
    setCompanies(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetch$() }, [fetch$])

  function openAdd() {
    setEditCompany(null)
    setForm({ name:'', size:'', industry:'', areaOfWork:'', address:'', website:'', notes:'' })
    setModalOpen(true)
  }

  function openEdit(c: Company) {
    setEditCompany(c)
    setForm({ name: c.name, size: c.size||'', industry: c.industry||'', areaOfWork: c.areaOfWork||'', address: c.address||'', website: c.website||'', notes:'' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Company name is required')
    setSaving(true)
    const url = editCompany ? `/api/companies/${editCompany.id}` : '/api/companies'
    const res = await fetch(url, {
      method: editCompany ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, size: form.size || undefined }),
    })
    setSaving(false)
    if (res.ok) { toast.success(editCompany ? 'Updated' : 'Company added'); setModalOpen(false); fetch$() }
    else toast.error('Something went wrong')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/companies/${deleteTarget.id}`, { method: 'DELETE' })
    toast.success('Company deleted'); setDeleteTarget(null); fetch$()
  }

  return (
    <>
      <Header
        title="Companies"
        subtitle={`${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'}`}
        actions={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} /> Add Company</button>}
      />
      <div className="p-6">
        <div className="mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search companies..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : companies.length === 0 ? (
          <EmptyState title="No companies yet" description="Track your client and prospect companies" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={14}/> Add Company</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <div key={c.id} className="card p-5 group hover:border-blue-500/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="md" />
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</h3>
                      {c.industry && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.industry}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}><Pencil size={13} /></button>
                    <button onClick={() => setDeleteTarget(c)} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {c.size && (
                    <div className="flex items-center gap-1.5">
                      <Users size={11} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{SIZE_LABELS[c.size]} employees</span>
                    </div>
                  )}
                  {c.areaOfWork && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.areaOfWork}</p>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.address}</span>
                    </div>
                  )}
                  {c.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} style={{ color: 'var(--text-muted)' }} />
                      <a href={c.website} target="_blank" className="text-xs" style={{ color: 'var(--text-brand)' }}>{c.website.replace(/^https?:\/\//, '')}</a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c._count.contacts} contacts</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c._count.leads} leads</span>
                  <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCompany ? 'Edit Company' : 'Add Company'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company Name *</label>
            <input className="input" placeholder="Acme Inc." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Size</label>
              <select className="select" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                <option value="">Select size</option>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{SIZE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Industry</label>
              <input className="input" placeholder="Digital Marketing" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Area of Work</label>
            <input className="input" placeholder="Web Dev, SEO, Branding..." value={form.areaOfWork} onChange={e => setForm(f => ({ ...f, areaOfWork: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Address</label>
            <input className="input" placeholder="Dhaka, Bangladesh" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Website</label>
            <input className="input" placeholder="https://company.com" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : editCompany ? 'Update' : 'Add Company'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Company" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} />
    </>
  )
}
