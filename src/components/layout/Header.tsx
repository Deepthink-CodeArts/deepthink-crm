'use client'
// src/components/layout/Header.tsx
import { useSession } from 'next-auth/react'
import { getInitials } from '@/lib/utils'
import { Bell, Search } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(8,13,26,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Bell size={16} />
        </button>

        {/* Avatar */}
        {session?.user && (
          <Link href="/profile">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-105"
              style={{ background: 'var(--brand)', color: 'white', border: '2px solid transparent' }}
              title="View Profile"
            >
              {getInitials(session.user.name ?? 'U')}
            </div>
          </Link>
        )}
      </div>
    </header>
  )
}
