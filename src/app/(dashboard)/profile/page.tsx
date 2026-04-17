'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        email: session.user.email || '',
        password: ''
      })
    }
  }, [session])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Profile updated')
      update({ name: form.name, email: form.email })
      setForm(f => ({ ...f, password: '' }))
    } else {
      toast.error('Failed to update profile')
    }
  }

  if (!session?.user) return <div className="p-6">Loading...</div>

  return (
    <>
      <Header title="Your Profile" subtitle="Manage your personal account settings" />
      <div className="p-6 max-w-2xl mx-auto mt-6">
        <div className="card p-8">
          
          <div className="flex items-center gap-6 mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl"
              style={{ background: 'var(--brand)', color: 'white' }}
            >
              {getInitials(form.name || session.user.name || 'U')}
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{form.name || session.user.name}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{(session.user as any).roleName || 'Team Member'}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password <span style={{ color: 'var(--text-muted)' }}>(leave blank to keep current)</span></label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" />
              </div>
            </div>

            <div className="pt-5 mt-2 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="submit" disabled={saving} className="btn-primary min-w-[120px] justify-center">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}
