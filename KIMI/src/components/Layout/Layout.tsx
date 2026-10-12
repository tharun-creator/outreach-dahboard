import { useEffect } from 'react'
import { cn } from '../../lib/utils'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useStore, useCurrentView, useSidebarOpen } from '../../store'
import { ChatView } from '../Chat/ChatView'
import { ClientsView } from '../Clients/ClientsView'
import { RemindersView } from '../Reminders/RemindersView'
import { MeetingsView } from '../Meetings/MeetingsView'
import { InsightsView } from '../Insights/InsightsView'
import { SettingsView } from '../Settings/SettingsView'
import { useNotificationChecker, useBrowserNotifications } from '../../hooks/useNotifications'

export function Layout() {
  const currentView = useCurrentView()
  const sidebarOpen = useSidebarOpen()
  const { theme } = useStore((s) => s.preferences)

  useNotificationChecker()
  useBrowserNotifications()

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatView />
      case 'clients':
        return <ClientsView />
      case 'reminders':
        return <RemindersView />
      case 'meetings':
        return <MeetingsView />
      case 'insights':
        return <InsightsView />
      case 'settings':
        return <SettingsView />
      default:
        return <ChatView />
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:ml-72' : 'lg:ml-20')}>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8" id="main-content" role="main">
          {renderView()}
        </main>
      </div>
    </div>
  )
}