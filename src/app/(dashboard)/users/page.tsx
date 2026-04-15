'use client'
// src/app/(dashboard)/users/page.tsx
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Modal, Avatar } from '@/components/ui'
import { Plus, Shield, Users, Check, X } from 'lucide-react'
import { toast } from 'sonner'

type Role = { id: string; name: string; description?: string; isSystem: boolean; _count: { users: number }; permissions: Permission[] }
type Permission = { module: string; canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }
type User = { id: string; name: string; email: string; isActive: boolean; role: { id: string; name: string } }

const ALL_MODULES = ['CONTACTS','COMPANIES','LEADS','DEALS','PROJECTS','TASKS','INVOICES','USERS','SETTINGS']

export default function UsersPage() {
  const [tab, setTab] = useState<'users'|'roles'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userModal, setUserModal] = useState(false)
  const [roleModal, setRoleModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [userForm, setUserForm] = useState({ name:'', email:'', password:'', roleId:'' })
  const [roleForm, setRoleForm] = useState({ name:'', description:'' })
  const [permissions, setPermissions] = useState<Record<string, { canCreate:boolean; canRead:boolean; canUpdate:boolean; canDelete:boolean }>>(() =>
    Object.fromEntries(ALL_MODULES.map(m => [m, { canCreate:false, canRead:true, canUpdate:false, canDelete:false }]))
  )

  useEffect(() => {
    fetch('/api/users').then(r=>r.json()).then(d => setUsers(Array.isArray(d)?d:[]))
    fetch('/api/roles').then(r=>r.json()).then(d => setRoles(Array.isArray(d)?d:[]))
  }, [])

  async function handleAddUser() {
    if (!userForm.name || !userForm.email || !userForm.password || !userForm.roleId) return toast.error('All fields required')
    setSaving(true)
    const res = await fetch('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(userForm) })
    setSaving(false)
    if (res.ok) {
      toast.success('User created')
      setUserModal(false)
      setUserForm({ name:'', email:'', password:'', roleId:'' })
      fetch('/api/users').then(r=>r.json()).then(d => setUsers(d))
    } else {
      const err = await res.json()
      toast.error(err.error || 'Error')
    }
  }

  async function handleAddRole() {
    if (!roleForm.name) return toast.error('Role name required')
    setSaving(true)
    const perms = ALL_MODULES.map(m => ({ module: m, ...permissions[m] }))
    const res = await fetch('/api/roles', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...roleForm, permissions: perms }) })
    setSaving(false)
    if (res.ok) {
      toast.success('Role created')
      setRoleModal(false)
      fetch('/api/roles').then(r=>r.json()).then(d => setRoles(d))
    }
  }

  function togglePerm(module: string, action: string) {
    setPermissions(p => ({ ...p, [module]: { ...p[module], [action]: !p[module][action as keyof typeof p[string]] } }))
  }

  return (
    <>
      <Header title="Team & Roles" subtitle="Manage your internal team members and permissions" />
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background:'var(--bg-elevated)', display:'inline-flex' }}>
          {(['users','roles'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: tab===t ? 'var(--brand)' : 'transparent',
                color: tab===t ? 'white' : 'var(--text-secondary)',
              }}
            >
              {t === 'users' ? <><Users size={13} className="inline mr-1.5"/>Users</> : <><Shield size={13} className="inline mr-1.5"/>Roles</>}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{users.length} team member{users.length!==1?'s':''}</p>
              <button onClick={() => setUserModal(true)} className="btn-primary text-sm"><Plus size={15}/>Add User</button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['Member','Email','Role','Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color:'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm"/>
                          <span className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color:'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--brand-dim)', color:'var(--brand-light)' }}>{u.role.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Roles Tab */}
        {tab === 'roles' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color:'var(--text-secondary)' }}>{roles.length} roles</p>
              <button onClick={() => setRoleModal(true)} className="btn-primary text-sm"><Plus size={15}/>Add Role</button>
            </div>
            <div className="space-y-3">
              {roles.map(role => (
                <div key={role.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>{role.name}</h3>
                        {role.isSystem && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background:'var(--brand-dim)', color:'var(--brand-light)' }}>System</span>}
                      </div>
                      {role.description && <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{role.description}</p>}
                    </div>
                    <span className="text-xs" style={{ color:'var(--text-muted)' }}>{role._count.users} user{role._count.users!==1?'s':''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom:'1px solid var(--border)' }}>
                          <th className="py-1.5 text-left font-medium" style={{ color:'var(--text-muted)' }}>Module</th>
                          {['Read','Create','Update','Delete'].map(a => (
                            <th key={a} className="py-1.5 text-center font-medium w-16" style={{ color:'var(--text-muted)' }}>{a}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {role.permissions.map(p => (
                          <tr key={p.module} style={{ borderBottom:'1px solid var(--border)' }}>
                            <td className="py-1.5 font-medium" style={{ color:'var(--text-secondary)' }}>{p.module}</td>
                            {[p.canRead, p.canCreate, p.canUpdate, p.canDelete].map((v,i) => (
                              <td key={i} className="py-1.5 text-center">
                                {v ? <Check size={12} style={{ color:'#34d399', margin:'0 auto' }}/> : <X size={12} style={{ color:'var(--text-muted)', margin:'0 auto' }}/>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      <Modal open={userModal} onClose={() => setUserModal(false)} title="Add User" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Full Name *</label>
            <input className="input" value={userForm.name} onChange={e => setUserForm(f=>({...f,name:e.target.value}))} placeholder="John Doe"/>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Email *</label>
            <input className="input" type="email" value={userForm.email} onChange={e => setUserForm(f=>({...f,email:e.target.value}))} placeholder="john@deepthink.com"/>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Password *</label>
            <input className="input" type="password" value={userForm.password} onChange={e => setUserForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 chars"/>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Role *</label>
            <select className="select" value={userForm.roleId} onChange={e => setUserForm(f=>({...f,roleId:e.target.value}))}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setUserModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddUser} disabled={saving} className="btn-primary text-sm">{saving?'Creating...':'Create User'}</button>
          </div>
        </div>
      </Modal>

      {/* Add Role Modal */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Create Role" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Role Name *</label>
              <input className="input" value={roleForm.name} onChange={e => setRoleForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Sales Manager"/>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Description</label>
              <input className="input" value={roleForm.description} onChange={e => setRoleForm(f=>({...f,description:e.target.value}))} placeholder="Optional"/>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2" style={{ color:'var(--text-secondary)' }}>Module Permissions</p>
            <div className="rounded-xl overflow-hidden" style={{ border:'1px solid var(--border)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background:'var(--bg-elevated)' }}>
                    <th className="px-3 py-2 text-left font-medium" style={{ color:'var(--text-muted)' }}>Module</th>
                    {['Read','Create','Update','Delete'].map(a => (
                      <th key={a} className="px-3 py-2 text-center font-medium" style={{ color:'var(--text-muted)' }}>{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map(mod => (
                    <tr key={mod} style={{ borderTop:'1px solid var(--border)' }}>
                      <td className="px-3 py-2 font-medium" style={{ color:'var(--text-secondary)' }}>{mod}</td>
                      {(['canRead','canCreate','canUpdate','canDelete'] as const).map(action => (
                        <td key={action} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[mod][action]}
                            onChange={() => togglePerm(mod, action)}
                            className="w-3.5 h-3.5 cursor-pointer accent-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setRoleModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddRole} disabled={saving} className="btn-primary text-sm">{saving?'Creating...':'Create Role'}</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
