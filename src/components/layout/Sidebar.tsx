'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users, Building2, Target, Handshake, FolderKanban,
  CheckSquare, Receipt, Settings, LogOut, Zap, ChevronRight, ShieldCheck
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',  icon: Zap },
  { href: '/contacts',    label: 'Contacts',   icon: Users },
  { href: '/companies',   label: 'Companies',  icon: Building2 },
  { href: '/leads',       label: 'Leads',      icon: Target },
  { href: '/deals',       label: 'Deals',      icon: Handshake },
  { href: '/projects',    label: 'Projects',   icon: FolderKanban },
  { href: '/tasks',       label: 'Tasks',      icon: CheckSquare },
  { href: '/invoices',    label: 'Invoices',   icon: Receipt },
  { href: '/users',       label: 'Team',       icon: ShieldCheck },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-30"
      style={{
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <img 
          src="/images/deepthink-logo.png" 
          alt="DeepThink Logo" 
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                active
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={{
                background: active ? 'var(--brand-dim)' : 'transparent',
                color: active ? 'var(--brand-light)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full text-left"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
