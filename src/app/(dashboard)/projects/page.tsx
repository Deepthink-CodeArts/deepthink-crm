'use client'
// src/app/(dashboard)/projects/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog } from '@/components/ui'
import { Plus, Calendar, Users, CheckSquare, Pencil, Trash2, FolderKanban } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type Project = {
  id: string; title: string; description?: string; status: string
  deadline?: string
  deal?: { id: string; title: string }
  members: { user: { id: string; name: string }; role?: string }[]
  _count: { tasks: number; documents: number }
  createdAt: string
}

const STATUS_COLOR = { ACTIVE:'#3B82F6', ON_HOLD:'#F59E0B', COMPLETED:'#10B981', CANCELLED:'#EF4444' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title:'', description:'', plan:'', deadline:'', status:'ACTIVE'
  })

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  function openAdd() { setEditProject(null); setForm({ title:'', description:'', plan:'', deadline:'', status:'ACTIVE' }); setModalOpen(true) }
  function openEdit(p: Project) {
    setEditProject(p)
    setForm({ title:p.title, description:p.description||'', plan:'', deadline: p.deadline ? p.deadline.slice(0,10) : '', status:p.status })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Title required')
    setSaving(true)
    const url = editProject ? `/api/projects/${editProject.id}` : '/api/projects'
    const res = await fetch(url, {
      method: editProject ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, deadline: form.deadline || undefined }),
    })
    setSaving(false)
    if (res.ok) { toast.success(editProject ? 'Updated' : 'Project created'); setModalOpen(false); fetchProjects() }
    else toast.error('Error')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/projects/${deleteTarget.id}`, { method:'DELETE' })
    toast.success('Deleted'); setDeleteTarget(null); fetchProjects()
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/projects/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    fetchProjects()
  }

  return (
    <>
      <Header
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        actions={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={15}/>New Project</button>}
      />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : projects.length === 0 ? (
          <EmptyState title="No projects yet" description="Create projects to track execution for your deals" action={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={14}/>New Project</button>} icon={FolderKanban}/>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p.id} className="card p-5 group flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[p.status as keyof typeof STATUS_COLOR] || '#64748B' }} />
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                    </div>
                    {p.deal && <p className="text-xs ml-4" style={{ color: 'var(--text-muted)' }}>↳ {p.deal.title}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(p)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--text-muted)' }}><Pencil size={11}/></button>
                    <button onClick={() => setDeleteTarget(p)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--text-muted)' }}><Trash2 size={11}/></button>
                  </div>
                </div>

                {p.description && (
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {p.deadline && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} style={{ color: 'var(--text-muted)' }}/>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(p.deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users size={11} style={{ color: 'var(--text-muted)' }}/>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.members.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckSquare size={11} style={{ color: 'var(--text-muted)' }}/>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p._count.tasks} tasks</span>
                  </div>
                </div>

                {/* Status selector */}
                <select
                  value={p.status}
                  onChange={e => changeStatus(p.id, e.target.value)}
                  className="text-xs rounded-xl px-3 py-1.5 border outline-none cursor-pointer w-full"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <option value="ACTIVE">🟢 Active</option>
                  <option value="ON_HOLD">🟡 On Hold</option>
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="CANCELLED">🔴 Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProject ? 'Edit Project' : 'New Project'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input className="input" placeholder="Project name" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Project overview..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Scope / Plan</label>
            <textarea className="input resize-none" rows={3} placeholder="Deliverables, milestones, scope..." value={form.plan} onChange={e => setForm(f=>({...f,plan:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editProject ? 'Update' : 'Create Project'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message={`Delete "${deleteTarget?.title}"?`} />
    </>
  )
}
