'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import { toast } from 'sonner'

type MeetingFormProps = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  prefill?: { leadId?: string, dealId?: string, contactId?: string }
}

export function MeetingModal({ open, onClose, onSaved, prefill }: MeetingFormProps) {
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<{id: string, name: string}[]>([])
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 30,
    contactIds: [] as string[]
  })

  // Load contacts for attendee selection
  useEffect(() => {
    if (open) {
      fetch('/api/contacts').then(r=>r.json()).then(d => setContacts(Array.isArray(d) ? d : []))
    }
  }, [open])

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 30,
        contactIds: prefill?.contactId ? [prefill.contactId] : []
      })
    }
  }, [open, prefill])

  async function handleSave() {
    if (!form.title.trim() || !form.scheduledAt) return toast.error('Title and Date are required')
    setSaving(true)
    
    // Merge prefill data
    const linkIds = {
      leadId: prefill?.leadId,
      dealId: prefill?.dealId
    }
    
    const payload = {
      ...form,
      ...linkIds,
      contactIds: form.contactIds.length > 0 ? form.contactIds : []
    }

    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (res.ok) {
      toast.success('Meeting scheduled')
      onSaved()
      onClose()
    } else {
      toast.error('Error scheduling meeting')
    }
  }

  function toggleContact(id: string) {
    setForm(f => ({
      ...f,
      contactIds: f.contactIds.includes(id)
        ? f.contactIds.filter(c => c !== id)
        : [...f.contactIds, id]
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Meeting" size="sm">
      <div className="space-y-3 max-h-[80vh] overflow-y-auto px-1 pb-1">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Event Title *</label>
          <input className="input" placeholder="Discovery Call..." value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Agenda / Description</label>
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date & Time *</label>
            <input className="input" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f=>({...f,scheduledAt:e.target.value}))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Duration (mins)</label>
            <input className="input" type="number" step={15} value={form.duration} onChange={e => setForm(f=>({...f,duration:parseInt(e.target.value) || 30}))} />
          </div>
        </div>

        {/* Attendees Selection */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Attendees (Contacts)</label>
          <div className="border rounded-xl p-2 max-h-32 overflow-y-auto space-y-1" style={{ borderColor: 'var(--border)' }}>
            {contacts.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No contacts found</p>
            ) : contacts.map(contact => (
              <label key={contact.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={form.contactIds.includes(contact.id)}
                  onChange={() => toggleContact(contact.id)}
                  className="rounded text-blue-500 bg-transparent border-gray-600 cursor-pointer"
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{contact.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
