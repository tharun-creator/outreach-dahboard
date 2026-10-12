import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, usePreferences, useNotifications } from '../../store'
import { Bell, Sun, Moon, Monitor, ChevronDown, LogOut, Calendar } from 'lucide-react'

export function Header() {
  const { theme, notificationsEnabled, soundEnabled } = usePreferences()
  const updatePreferences = useStore((s) => s.updatePreferences)
  const notifications = useNotifications()
  const unreadCount = notifications.filter((n) => !n.read).length
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % 3]
    updatePreferences({ theme: nextTheme })
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'dark':
        return <Moon className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      default:
        return 'System'
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100" id="page-title">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors',
                unreadCount > 0 && 'text-brand-600 dark:text-brand-400'
              )}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden animate-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => useStore.getState().markAllNotificationsRead()}
                      className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          useStore.getState().markNotificationRead(notification.id)
                          if (notification.actionUrl) {
                            window.location.hash = notification.actionUrl
                          }
                          setShowNotifications(false)
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0',
                          !notification.read && 'bg-zinc-50 dark:bg-zinc-800/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                              getNotificationIconBg(notification.type)
                            )}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', !notification.read ? 'font-semibold' : '')}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-2" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            aria-label={`Theme: ${getThemeLabel()}, click to change`}
            title={`Theme: ${getThemeLabel()}`}
          >
            {getThemeIcon()}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium dark:bg-brand-900/30 dark:text-brand-400">
                U
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg overflow-hidden animate-in">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">User</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">user@example.com</p>
                </div>
                <div className="py-1">
                  <label className="flex items-center justify-between px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Notifications</span>
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => updatePreferences({ notificationsEnabled: e.target.checked })}
                      className="w-4 h-4 text-brand-600 border-zinc-300 rounded focus:ring-brand-500"
                    />
                  </label>
                  <label className="flex items-center justify-between px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">Sound</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                      className="w-4 h-4 text-brand-600 border-zinc-300 rounded focus:ring-brand-500"
                    />
                  </label>
                  <hr className="my-1 border-zinc-200 dark:border-zinc-800" />
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function getPageTitle(): string {
  const hash = window.location.hash.slice(1)
  const view = hash || 'chat'
  const titles: Record<string, string> = {
    chat: 'Chat',
    clients: 'Clients',
    reminders: 'Reminders',
    meetings: 'Meetings',
    insights: 'Insights',
    settings: 'Settings',
  }
  return titles[view] || 'Kimi'
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'reminder':
    case 'follow_up':
      return <Bell className="h-4 w-4" />
    case 'meeting':
      return <Calendar className="h-4 w-4" />
    case 'heads_up':
      return <span className="text-xs font-bold">!</span>
    case 'ai_insight':
      return <span className="text-xs font-bold">✨</span>
    default:
      return <Bell className="h-4 w-4" />
  }
}

function getNotificationIconBg(type: string): string {
  switch (type) {
    case 'reminder':
    case 'follow_up':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    case 'meeting':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    case 'heads_up':
      return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    case 'ai_insight':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
  }
}

function formatRelativeTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}