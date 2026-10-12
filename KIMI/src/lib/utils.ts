import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d)} at ${formatTime(d)}`
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)

  if (Math.abs(diffMins) < 1) return 'just now'
  if (Math.abs(diffMins) < 60) return `${diffMins > 0 ? 'in' : ''} ${Math.abs(diffMins)} min`
  if (Math.abs(diffHours) < 24) return `${diffHours > 0 ? 'in' : ''} ${Math.abs(diffHours)} hr`
  if (Math.abs(diffDays) < 7) return `${diffDays > 0 ? 'in' : ''} ${Math.abs(diffDays)} days`
  return formatDate(d)
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

export function isDueSoon(date: string | Date, minutes = 30): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const threshold = new Date(now.getTime() + minutes * 60000)
  return d >= now && d <= threshold
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'badge-success',
    prospect: 'badge-info',
    inactive: 'badge-warning',
    churned: 'badge-danger',
    scheduled: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    rescheduled: 'badge-warning',
    pending: 'badge-warning',
    snoozed: 'badge-info',
    dismissed: 'badge-danger',
  }
  return colors[status] || 'badge-info'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'badge-info',
    medium: 'badge-warning',
    high: 'badge-danger',
    urgent: 'bg-red-600 text-white',
  }
  return colors[priority] || 'badge-info'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}