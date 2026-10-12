import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, useNotifications } from '../../store'
import { X, Bell, Calendar, AlertTriangle, Sparkles } from 'lucide-react'

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
type NotificationType = 'reminder' | 'meeting' | 'heads_up' | 'ai_insight' | 'follow_up'

interface ToastNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  actionUrl?: string
  relatedId?: string
  createdAt: string
}

export function Toaster() {
  const notifications = useNotifications()
  const markNotificationRead = useStore((s) => s.markNotificationRead)
  const [displayedNotifications, setDisplayedNotifications] = useState<Set<string>>(new Set())

  // Auto-show new unread notifications
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read && !displayedNotifications.has(n.id))
    unread.forEach((notification) => {
      setDisplayedNotifications((prev) => new Set([...prev, notification.id]))
      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        markNotificationRead(notification.id)
        setDisplayedNotifications((prev) => {
          const next = new Set(prev)
          next.delete(notification.id)
          return next
        })
      }, 8000)
    })
  }, [notifications, displayedNotifications, markNotificationRead])

  const toShow = notifications.filter((n) => displayedNotifications.has(n.id))

  if (toShow.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toShow.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onDismiss={() => {
            markNotificationRead(notification.id)
            setDisplayedNotifications((prev) => {
              const next = new Set(prev)
              next.delete(notification.id)
              return next
            })
          }}
        />
      ))}
    </div>
  )
}

function Toast({ notification, onDismiss }: { notification: ToastNotification; onDismiss: () => void }) {
  const icons: Record<NotificationType, React.ReactNode> = {
    reminder: <Bell className="h-5 w-5 text-amber-500" />,
    meeting: <Calendar className="h-5 w-5 text-blue-500" />,
    heads_up: <AlertTriangle className="h-5 w-5 text-red-500" />,
    ai_insight: <Sparkles className="h-5 w-5 text-purple-500" />,
    follow_up: <Bell className="h-5 w-5 text-amber-500" />,
  }

  const colors: Record<NotificationPriority, string> = {
    low: 'border-l-blue-500',
    medium: 'border-l-amber-500',
    high: 'border-l-orange-500',
    urgent: 'border-l-red-500',
  }

  return (
    <div className={cn(
      'card p-4 flex items-start gap-3 animate-in shadow-lg',
      colors[notification.priority] || 'border-l-zinc-500'
    )}>
      <div className="flex-shrink-0 mt-0.5">{icons[notification.type] || icons.reminder}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{notification.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{notification.message}</p>
      </div>
      <button onClick={onDismiss} className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}