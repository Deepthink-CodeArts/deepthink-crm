// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), 'MMM dd, yyyy · hh:mm a')
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(amount))
}

export function generateInvoiceNumber() {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `INV-${year}-${rand}`
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Permission checker
export function hasPermission(
  permissions: any[],
  module: string,
  action: 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete'
): boolean {
  if (!permissions) return false
  const perm = permissions.find(p => p.module === module)
  return perm?.[action] ?? false
}

export const STATUS_COLORS = {
  // Contact
  ACTIVE:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INACTIVE:  'bg-red-500/15 text-red-400 border-red-500/30',
  PENDING:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  // Lead quality
  HIGH:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  LOW:       'bg-slate-500/15 text-slate-400 border-slate-500/30',
  // Deal/Project
  ON_HOLD:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  // Task
  TODO:        'bg-slate-500/15 text-slate-400 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  DONE:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  // Invoice
  DRAFT:    'bg-slate-500/15 text-slate-400 border-slate-500/30',
  SENT:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PAID:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OVERDUE:  'bg-red-500/15 text-red-400 border-red-500/30',
  // Deal stage
  WORKING:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  WON:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  LOST:     'bg-red-500/15 text-red-400 border-red-500/30',
} as const
