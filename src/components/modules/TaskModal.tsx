'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import { toast } from 'sonner'

type TaskFormProps = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initialData?: any
  prefill?: { contactId?: string, leadId?: string, dealId?: string, projectId?: string }
}

export function TaskModal({ open, onClose, onSaved, initialData, prefill }: TaskFormProps) {
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<{id: string, name: string}[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    urgency: 'MEDIUM',
    status: 'TODO',
    deadline: '',
    assigneeIds: [] as string[]
  })

  // Load users for assignee selection
  useEffect(() => {
    if (open) {
      fetch('/api/users').then(r=>r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
    }
  }, [open])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          title: initialData.title,
          description: initialData.description || '',
          urgency: initialData.urgency,
          status: initialData.status,
          deadline: initialData.deadline ? initialData.deadline.slice(0,10) : '',
          assigneeIds: initialData.assignees ? initialData.assignees.map((a: any) => a.id) : []
        })
      } else {
        setForm({
          title: '', description: '', urgency: 'MEDIUM', status: 'TODO', deadline: '', assigneeIds: []
        })
      }
    }
  }, [open, initialData])

  async function handleSave() {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    
    // Merge prefill data if this is a new task
    const linkIds = initialData ? {} : prefill || {}
    
    const payload = {
      ...form,
      ...linkIds,
      deadline: form.deadline || undefined,
      assigneeIds: form.assigneeIds.length > 0 ? form.assigneeIds : []
    }

    const url = initialData ? `/api/tasks/${initialData.id}` : '/api/tasks'
    const res = await fetch(url, {
      method: initialData ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (res.ok) {
      toast.success(initialData ? 'Task updated' : 'Task created')
      onSaved()
      onClose()
    } else {
      toast.error('Error saving task')
    }
  }

  function toggleAssignee(id: string) {
    setForm(f => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter(a => a !== id)
        : [...f.assigneeIds, id]
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title={initialData ? 'Edit Task' : 'New Task'} size="sm">
      <div className="space-y-3 max-h-[80vh] overflow-y-auto px-1 pb-1">
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

        {/* Assignees Selection */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assignees</label>
          <div className="border rounded-xl p-2 max-h-32 overflow-y-auto space-y-1" style={{ borderColor: 'var(--border)' }}>
            {users.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No team members found</p>
            ) : users.map(user => (
              <label key={user.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={form.assigneeIds.includes(user.id)}
                  onChange={() => toggleAssignee(user.id)}
                  className="rounded text-blue-500 bg-transparent border-gray-600 cursor-pointer"
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving...' : initialData ? 'Update' : 'Create Task'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
