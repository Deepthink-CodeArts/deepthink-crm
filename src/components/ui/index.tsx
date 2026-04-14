'use client'
// src/components/ui/index.tsx
// All reusable base UI components

import { cn, STATUS_COLORS } from '@/lib/utils'
import { X, AlertCircle, Inbox } from 'lucide-react'
import { useEffect } from 'react'

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
interface BadgeProps {
  status: keyof typeof STATUS_COLORS
  label?: string
  className?: string
}

export function Badge({ status, label, className }: BadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING
  const displayLabel = label ?? status.replace(/_/g, ' ')
  return (
    <span className={cn('badge', colorClass, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {displayLabel}
    </span>
  )
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn('w-full rounded-2xl shadow-2xl animate-slide-in', sizeMap[size])}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ElementType
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <Icon size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}



// ─────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────
interface ConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }: ConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} style={{ color: '#f87171' }} />
        </div>
        <p className="text-sm pt-1" style={{ color: 'var(--text-secondary)' }}>{message}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="btn-secondary text-sm" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn-danger text-sm" disabled={loading}>
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

// ─────────────────────────────────────────────
// LOADING SPINNER
// ─────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size, color: 'var(--brand)' }}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────
import { Search } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 w-64 text-sm"
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE WRAPPER
// ─────────────────────────────────────────────
export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ marginLeft: '240px' }}>
      {children}
    </main>
  )
}

export function PageContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>
}

// ─────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#6366F1',
]

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  const bg = color ?? AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const sizeClass = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }[size]
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold shrink-0', sizeClass)}
      style={{ background: bg, color: 'white' }}
    >
      {getInitials(name)}
    </div>
  )
}
