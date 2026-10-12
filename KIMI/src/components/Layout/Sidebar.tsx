import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, useCurrentView, useSidebarOpen, useSelectedClientId, useSearchQuery } from '../../store'
import type { ViewType } from '../../types'
import {
  MessageSquare,
  Users,
  Bell,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react'

const navigation: { id: ViewType; label: string; icon: React.ReactNode; href: string }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-5 w-5" />, href: '#chat' },
  { id: 'clients', label: 'Clients', icon: <Users className="h-5 w-5" />, href: '#clients' },
  { id: 'reminders', label: 'Reminders', icon: <Bell className="h-5 w-5" />, href: '#reminders' },
  { id: 'meetings', label: 'Meetings', icon: <Calendar className="h-5 w-5" />, href: '#meetings' },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="h-5 w-5" />, href: '#insights' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '#settings' },
]

export function Sidebar() {
  const currentView = useCurrentView()
  const sidebarOpen = useSidebarOpen()
  const selectedClientId = useSelectedClientId()
  const searchQuery = useSearchQuery()
  const setCurrentView = useStore((s) => s.setCurrentView)
  const setSidebarOpen = useStore((s) => s.setSidebarOpen)
  const setSelectedClientId = useStore((s) => s.setSelectedClientId)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const clients = useStore((s) => s.clients)
  const reminders = useStore((s) => s.reminders)
  const meetings = useStore((s) => s.meetings)

  const [localSearch, setLocalSearch] = useState(searchQuery)

  const pendingReminders = reminders.filter((r) => r.status === 'pending').length
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()
  ).length

  const getBadgeCount = (view: ViewType) => {
    switch (view) {
      case 'reminders':
        return pendingReminders
      case 'meetings':
        return upcomingMeetings
      default:
        return 0
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-out',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Kimi</span>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Search */}
      {sidebarOpen && (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search clients, reminders..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value)
                setSearchQuery(e.target.value)
              }}
              className="input pl-10"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('')
                  setSearchQuery('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = currentView === item.id
          const badgeCount = getBadgeCount(item.id)
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id)
                setSelectedClientId(null)
              }}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
                !sidebarOpen && 'justify-center px-0'
              )}
              title={sidebarOpen ? undefined : item.label}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold text-brand-700 bg-brand-100 rounded-full dark:bg-brand-900/30 dark:text-brand-400">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Quick Client Switcher */}
      {sidebarOpen && clients.length > 0 && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Recent Clients
          </h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {clients
              .slice()
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id)
                    setCurrentView('chat')
                  }}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedClientId === client.id
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  )}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium dark:bg-brand-900/30 dark:text-brand-400"
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 truncate">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-xs text-zinc-500 truncate dark:text-zinc-400">{client.company}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        {sidebarOpen ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>Kimi Assistant v1.0</p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Connected to Kimi K3
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" title="Connected" />
          </div>
        )}
      </div>
    </aside>
  )
}