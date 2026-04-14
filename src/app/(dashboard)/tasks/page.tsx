'use client'
// src/app/(dashboard)/tasks/page.tsx
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Badge, Modal, EmptyState, ConfirmDialog } from '@/components/ui'
import { Plus, Clock, Trash2, Pencil, CheckCircle2, Circle, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type Task = {
  id: string; title: string; description?: string
  urgency: 'LOW'|'MEDIUM'|'HIGH'; status: 'TODO'|'IN_PROGRESS'|'DONE'|'CANCELLED'
  deadline?: string
  assignees: { id: string; name: string }[]
  contact?: { id: string; name: string }
  lead?: { id: string; title: string }
  deal?: { id: string; title: string }
  project?: { id: string; title: string }
}

const URGENCY_COLOR = { HIGH:'#EF4444', MEDIUM:'#F59E0B', LOW:'#64748B' }
const COLUMNS: { key: Task['status']; label: string; icon: any; color: string }[] = [
  { key:'TODO',        label:'To Do',      icon: Circle,        color:'#64748B' },
  { key:'IN_PROGRESS', label:'In Progress', icon: Loader,        color:'#3B82F6' },
  { key:'DONE',        label:'Done',       icon: CheckCircle2,  color:'#10B981' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title:'', description:'', urgency:'MEDIUM', status:'TODO', deadline:''
  })

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/tasks')
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  function openAdd() { setEditTask(null); setForm({ title:'', description:'', urgency:'MEDIUM', status:'TODO', deadline:'' }); setModalOpen(true) }
  function openEdit(t: Task) {
    setEditTask(t)
    setForm({ title:t.title, description:t.description||'', urgency:t.urgency, status:t.status, deadline: t.deadline ? t.deadline.slice(0,10) : '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Title required')
    setSaving(true)
    const url = editTask ? `/api/tasks/${editTask.id}` : '/api/tasks'
    const res = await fetch(url, {
      method: editTask ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, deadline: form.deadline || undefined }),
    })
    setSaving(false)
    if (res.ok) { toast.success(editTask ? 'Updated' : 'Task created'); setModalOpen(false); fetchTasks() }
    else toast.error('Error')
  }

  async function handleStatusChange(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTasks()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/tasks/${deleteTarget.id}`, { method:'DELETE' })
    toast.success('Deleted'); setDeleteTarget(null); fetchTasks()
  }

  const grouped = COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.key)
  }))

  return (
    <>
      <Header
        title="Tasks"
        subtitle={`${tasks.filter(t => t.status !== 'DONE').length} pending`}
        actions={<button onClick={openAdd} className="btn-primary text-sm"><Plus size={15}/>New Task</button>}
      />

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {grouped.map(col => (
              <div key={col.key}>
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3">
                  <col.icon size={14} style={{ color: col.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{col.label}</span>
                  <span
                    className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {col.tasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {col.tasks.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed py-8 text-center" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tasks</p>
                    </div>
                  )}
                  {col.tasks.map(task => (
                    <div
                      key={task.id}
                      className="card p-3.5 group"
                      style={{ borderLeft: `3px solid ${URGENCY_COLOR[task.urgency]}` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEdit(task)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--text-muted)' }}><Pencil size={11}/></button>
                          <button onClick={() => setDeleteTarget(task)} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: 'var(--text-muted)' }}><Trash2 size={11}/></button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${URGENCY_COLOR[task.urgency]}20`, color: URGENCY_COLOR[task.urgency] }}
                        >
                          {task.urgency}
                        </span>

                        {task.deadline && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={9}/>{formatDate(task.deadline)}
                          </span>
                        )}

                        {/* Linked entity */}
                        {(task.contact || task.lead || task.deal || task.project) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
                            {task.contact?.name || task.lead?.title || task.deal?.title || task.project?.title}
                          </span>
                        )}
                      </div>

                      {/* Move to next status */}
                      {task.status !== 'DONE' && (
                        <button
                          onClick={() => handleStatusChange(task.id, task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                          className="mt-2.5 text-[10px] font-medium w-full text-center py-1.5 rounded-lg transition-colors"
                          style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}
                        >
                          {task.status === 'TODO' ? '→ Start' : '✓ Mark Done'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'New Task'} size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title *</label>
            <input className="input" placeholder="Task title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Urgency</label>
              <select className="select" value={form.urgency} onChange={e => setForm(f=>({...f,urgency:e.target.value}))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
              <select className="select" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={e => setForm(f=>({...f,deadline:e.target.value}))} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : editTask ? 'Update' : 'Create Task'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Task" message={`Delete "${deleteTarget?.title}"?`} />
    </>
  )
}
