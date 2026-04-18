'use client'
// src/app/(dashboard)/leads/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog, SearchInput, Avatar } from '@/components/ui'
import { Plus, ChevronDown, ChevronUp, DollarSign, Pencil, Trash2, Zap, ListTodo, CalendarPlus } from 'lucide-react'
import { TaskModal } from '@/components/modules/TaskModal'
import { MeetingModal } from '@/components/modules/MeetingModal'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

type ProbableDeal = {
  id: string; description: string; amount: number
  complexity: 'LOW'|'MEDIUM'|'HIGH'; stage: 'WORKING'|'WON'|'LOST'
}
type Lead = {
  id: string; title: string; source?: string; description?: string
  quality: 'HIGH'|'MEDIUM'|'LOW'; status: string
  company?: { id: string; name: string }
  contacts: { contact: { id: string; name: string } }[]
  probableDeals: ProbableDeal[]
  createdAt: string
}
type Company = { id: string; name: string }
type Contact = { id: string; name: string }

const QUALITY_COLOR = { HIGH: '#10B981', MEDIUM: '#F59E0B', LOW: '#64748B' }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null)
  const [pdModal, setPdModal] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [actionEntity, setActionEntity] = useState<Lead | null>(null)

  const [form, setForm] = useState({ title:'', companyId:'', source:'', description:'', quality:'MEDIUM', contactIds:[] as string[] })
  const [pdForm, setPdForm] = useState({ description:'', amount:'', complexity:'MEDIUM', stage:'WORKING' })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/leads?search=${search}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchLeads() }, [fetchLeads])
  useEffect(() => {
    fetch('/api/companies').then(r=>r.json()).then(d => setCompanies(Array.isArray(d)?d:[]))
    fetch('/api/contacts').then(r=>r.json()).then(d => setContacts(Array.isArray(d)?d:[]))
  }, [])

  function openAdd() { setEditLead(null); setForm({ title:'', companyId:'', source:'', description:'', quality:'MEDIUM', contactIds:[] }); setModalOpen(true) }
  function openEdit(l: Lead) {
    setEditLead(l)
    setForm({ title:l.title, companyId:l.company?.id||'', source:l.source||'', description:l.description||'', quality:l.quality, contactIds:l.contacts.map(c=>c.contact.id) })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Title required')
    setSaving(true)
    const url = editLead ? `/api/leads/${editLead.id}` : '/api/leads'
    const res = await fetch(url, {
      method: editLead ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, companyId: form.companyId || undefined }),
    })
    setSaving(false)
    if (res.ok) { toast.success(editLead ? 'Lead updated' : 'Lead added'); setModalOpen(false); fetchLeads() }
    else toast.error('Error')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/leads/${deleteTarget.id}`, { method:'DELETE' })
    toast.success('Lead deleted'); setDeleteTarget(null); fetchLeads()
  }

  async function handleAddPd() {
    if (!pdModal || !pdForm.description || !pdForm.amount) return toast.error('Fill required fields')
    const res = await fetch(`/api/leads/${pdModal.id}/probable-deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pdForm, amount: parseFloat(pdForm.amount) }),
    })
    if (res.ok) {
      toast.success('Deal added')
      if (pdForm.stage === 'WON') toast.success('🎉 Deal auto-created in Deals!')
      setPdModal(null)
      setPdForm({ description:'', amount:'', complexity:'MEDIUM', stage:'WORKING' })
      fetchLeads()
    } else toast.error('Error')
  }

  async function updatePdStage(lead: Lead, pdId: string, stage: string) {
    const res = await fetch(`/api/leads/${lead.id}/probable-deals/${pdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    if (res.ok) {
      if (stage === 'WON') toast.success('🎉 Deal moved to Won — Deal auto-created!')
      fetchLeads()
    }
  }

  return (
    <>
      <Header
        title="Leads"
        subtitle={`${leads.length} lead${leads.length !== 1 ? 's' : ''}`}
        actions={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} /> Add Lead</button>}
      />
      <div className="p-6">
        <div className="mb-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : leads.length === 0 ? (
          <EmptyState title="No leads yet" description="Track your potential opportunities" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={14}/>Add Lead</button>}/>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <div key={lead.id} className="card overflow-hidden group">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  style={{ background: expanded === lead.id ? 'var(--bg-elevated)' : undefined }}
                  onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                >
                  {/* Quality dot */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: QUALITY_COLOR[lead.quality] }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{lead.title}</h3>
                      <Badge status={lead.quality} label={lead.quality} />
                      <Badge status={lead.status as any} label={lead.status.replace('_',' ')} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {lead.company && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{lead.company.name}</span>}
                      {lead.contacts && lead.contacts.length > 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {lead.contacts.map(c => c.contact.name).join(', ')}</span>}
                      {lead.source && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {lead.source}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {lead.probableDeals.length} deal{lead.probableDeals.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                      {formatCurrency(lead.probableDeals.reduce((s,d) => s + Number(d.amount), 0))}
                    </span>
                    <button onClick={e => { e.stopPropagation(); setActionEntity(lead); setTaskModalOpen(true) }} className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:text-blue-500" style={{ color: 'var(--text-muted)' }} title="Create Task"><ListTodo size={13}/></button>
                    <button onClick={e => { e.stopPropagation(); setActionEntity(lead); setMeetingModalOpen(true) }} className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:text-blue-500" style={{ color: 'var(--text-muted)' }} title="Schedule Meeting"><CalendarPlus size={13}/></button>
                    <button onClick={e => { e.stopPropagation(); openEdit(lead) }} className="w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }}><Pencil size={13}/></button>
                    <button onClick={e => { e.stopPropagation(); setDeleteTarget(lead) }} className="w-7 h-7 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}><Trash2 size={13}/></button>
                    {expanded === lead.id ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }}/> : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }}/>}
                  </div>
                </div>

                {/* Expanded: Probable Deals */}
                {expanded === lead.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between pt-3 mb-3">
                      <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Probable Deals</p>
                      <button onClick={() => setPdModal(lead)} className="btn-secondary text-xs py-1 px-2.5">
                        <Plus size={12}/> Add Deal
                      </button>
                    </div>
                    {lead.probableDeals.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>No probable deals yet. Add one to track potential revenue.</p>
                    ) : (
                      <div className="space-y-2">
                        {lead.probableDeals.map(pd => (
                          <div key={pd.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{pd.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold" style={{ color: '#10B981' }}>{formatCurrency(pd.amount)}</span>
                                <Badge status={pd.complexity as any} label={pd.complexity} />
                              </div>
                            </div>
                            <select
                              value={pd.stage}
                              onChange={e => updatePdStage(lead, pd.id, e.target.value)}
                              className="text-xs rounded-lg px-2 py-1 border outline-none cursor-pointer"
                              style={{
                                background: pd.stage === 'WON' ? 'rgba(16,185,129,0.15)' : pd.stage === 'LOST' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                borderColor: pd.stage === 'WON' ? 'rgba(16,185,129,0.3)' : pd.stage === 'LOST' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
                                color: pd.stage === 'WON' ? '#34d399' : pd.stage === 'LOST' ? '#f87171' : '#60a5fa',
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="WORKING">Working</option>
                              <option value="WON">Won</option>
                              <option value="LOST">Lost</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {lead.description && (
                      <p className="text-xs mt-3 p-3 rounded-xl" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>
                        {lead.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Lead Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editLead ? 'Edit Lead' : 'Add Lead'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input className="input" placeholder="Website Redesign for..." value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Company</label>
              <select className="select" value={form.companyId} onChange={e => setForm(f=>({...f,companyId:e.target.value}))}>
                <option value="">Select company (optional)</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Lead Quality</label>
              <select className="select" value={form.quality} onChange={e => setForm(f=>({...f,quality:e.target.value}))}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contacts (Ctrl/Cmd to select multiple)</label>
              <select 
                multiple
                className="select h-24 p-2" 
                value={form.contactIds} 
                onChange={e => {
                  const options = Array.from(e.target.options)
                  setForm(f=>({...f, contactIds: options.filter(o => o.selected).map(o => o.value)}))
                }}
              >
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Hold corresponding key to select multiple</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Source</label>
              <input className="input" placeholder="LinkedIn, Referral..." value={form.source} onChange={e => setForm(f=>({...f,source:e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Brief description of the opportunity..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving...' : editLead ? 'Update' : 'Add Lead'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Probable Deal Modal */}
      <Modal open={!!pdModal} onClose={() => setPdModal(null)} title="Add Probable Deal" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description *</label>
            <input className="input" placeholder="e.g. Full website rebuild" value={pdForm.description} onChange={e => setPdForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Estimated Amount *</label>
              <input className="input" type="number" placeholder="5000" value={pdForm.amount} onChange={e => setPdForm(f=>({...f,amount:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Complexity</label>
              <select className="select" value={pdForm.complexity} onChange={e => setPdForm(f=>({...f,complexity:e.target.value}))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Stage</label>
            <select className="select" value={pdForm.stage} onChange={e => setPdForm(f=>({...f,stage:e.target.value}))}>
              <option value="WORKING">Working</option>
              <option value="WON">Won — Auto creates a Deal 🎉</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setPdModal(null)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddPd} className="btn-primary text-sm">Add Deal</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Lead" message={`Delete "${deleteTarget?.title}"?`} />

      <TaskModal 
        open={taskModalOpen} 
        onClose={() => setTaskModalOpen(false)} 
        onSaved={fetchLeads} 
        prefill={{ leadId: actionEntity?.id }} 
      />
      <MeetingModal 
        open={meetingModalOpen} 
        onClose={() => setMeetingModalOpen(false)} 
        onSaved={fetchLeads} 
        prefill={{ leadId: actionEntity?.id }} 
      />
    </>
  )
}
