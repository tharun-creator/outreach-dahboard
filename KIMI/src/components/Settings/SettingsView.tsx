import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, usePreferences } from '../../store'
import { Bell, Sun, Moon, Monitor, Palette, Database, Download, Upload, Trash2, Info, Shield, MessageSquare } from 'lucide-react'

// Common timezones for the select dropdown
const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
]

export function SettingsView() {
  const preferences = usePreferences()
  const updatePreferences = useStore((s) => s.updatePreferences)
  const clients = useStore((s) => s.clients)
  const reminders = useStore((s) => s.reminders)
  const meetings = useStore((s) => s.meetings)
  const chatMessages = useStore((s) => s.chatMessages)
  const notifications = useStore((s) => s.notifications)

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'data' | 'about'>('general')

  const handleExport = () => {
    const data = {
      clients,
      reminders,
      meetings,
      chatMessages,
      notifications,
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kimi-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.clients) useStore.getState().clients.push(...data.clients)
        if (data.reminders) useStore.getState().reminders.push(...data.reminders)
        if (data.meetings) useStore.getState().meetings.push(...data.meetings)
        if (data.chatMessages) useStore.getState().chatMessages.push(...data.chatMessages)
        if (data.notifications) useStore.getState().notifications.push(...data.notifications)
        if (data.preferences) updatePreferences(data.preferences)
        alert('Data imported successfully!')
      } catch {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = () => {
    if (confirm('This will delete ALL data. This cannot be undone. Are you sure?')) {
      useStore.getState().clients.length = 0
      useStore.getState().reminders.length = 0
      useStore.getState().meetings.length = 0
      useStore.getState().chatMessages.length = 0
      useStore.getState().notifications.length = 0
    }
  }

  const stats = {
    clients: clients.length,
    reminders: reminders.length,
    meetings: meetings.length,
    messages: chatMessages.length,
    notifications: notifications.length,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Customize your Kimi Assistant experience
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
        {[
          { id: 'general', label: 'General', icon: <Info className="h-4 w-4" /> },
          { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
          { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
          { id: 'about', label: 'About', icon: <Shield className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <SettingsSection title="General" description="Basic application settings">
          <SettingItem
            label="Working Hours"
            description="Set your working hours for smart scheduling"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label htmlFor="workStart" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Start
                </label>
                <input
                  id="workStart"
                  type="time"
                  value={preferences.workingHoursStart}
                  onChange={(e) => updatePreferences({ workingHoursStart: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="workEnd" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  End
                </label>
                <input
                  id="workEnd"
                  type="time"
                  value={preferences.workingHoursEnd}
                  onChange={(e) => updatePreferences({ workingHoursEnd: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </SettingItem>

          <SettingItem
            label="Timezone"
            description="Your local timezone for scheduling"
          >
            <select
              value={preferences.timezone}
              onChange={(e) => updatePreferences({ timezone: e.target.value })}
              className="input w-auto"
            >
              {commonTimezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </SettingItem>

          <SettingItem
            label="Auto Snooze Duration"
            description="Default snooze time for reminders (minutes)"
          >
            <select
              value={preferences.autoSnoozeMinutes}
              onChange={(e) => updatePreferences({ autoSnoozeMinutes: parseInt(e.target.value, 10) })}
              className="input w-auto"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
              <option value={1440}>Tomorrow</option>
            </select>
          </SettingItem>
        </SettingsSection>
      )}

      {activeTab === 'appearance' && (
        <SettingsSection title="Appearance" description="Customize how Kimi looks">
          <SettingItem
            label="Theme"
            description="Choose your preferred color scheme"
          >
            <div className="flex gap-3">
              {[
                { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
                { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
                { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
              ].map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updatePreferences({ theme: theme.value as 'light' | 'dark' | 'system' })}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors',
                    preferences.theme === theme.value
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  )}
                >
                  {theme.icon}
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </SettingItem>
        </SettingsSection>
      )}

      {activeTab === 'notifications' && (
        <SettingsSection title="Notifications" description="Manage notification preferences">
          <SettingItem
            label="Enable Notifications"
            description="Receive browser notifications for reminders and meetings"
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={(e) => updatePreferences({ notificationsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors',
                preferences.notificationsEnabled ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'
              )} />
              <span className={cn(
                'absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-transform',
                preferences.notificationsEnabled && 'translate-x-5'
              )} />
            </label>
          </SettingItem>

          <SettingItem
            label="Notification Sound"
            description="Play a sound when notifications arrive"
          >
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors',
                preferences.soundEnabled ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'
              )} />
              <span className={cn(
                'absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow transition-transform',
                preferences.soundEnabled && 'translate-x-5'
              )} />
            </label>
          </SettingItem>

          <SettingItem
            label="Test Notification"
            description="Send a test notification to verify settings"
          >
            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Kimi Test', { body: 'Notifications are working!', icon: '/favicon.svg' })
                } else {
                  Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                      new Notification('Kimi Test', { body: 'Notifications are working!', icon: '/favicon.svg' })
                    }
                  })
                }
              }}
              className="btn-secondary"
            >
              <Bell className="h-4 w-4" />
              Send Test Notification
            </button>
          </SettingItem>
        </SettingsSection>
      )}

      {activeTab === 'data' && (
        <SettingsSection title="Data Management" description="Export, import, or clear your data">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Download all your data as a JSON file for backup or migration.
              </p>
              <button onClick={handleExport} className="btn-primary w-full">
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>

            <div className="card p-4">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Import data from a previously exported JSON file.
              </p>
              <label className="btn-secondary w-full cursor-pointer">
                <Upload className="h-4 w-4" />
                Choose File
                <input type="file" accept=".json" onChange={handleImport} className="sr-only" />
              </label>
            </div>

            <div className="card p-4 border-red-200 dark:border-red-900/30 md:col-span-2">
              <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-500" />
                Danger Zone
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Permanently delete all your data. This action cannot be undone.
              </p>
              <button onClick={handleClearAll} className="btn-danger">
                <Trash2 className="h-4 w-4" />
                Clear All Data
              </button>
            </div>
          </div>

          <div className="card p-4 mt-4">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Storage Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">{key}</p>
                </div>
              ))}
            </div>
          </div>
        </SettingsSection>
      )}

      {activeTab === 'about' && (
        <SettingsSection title="About Kimi Assistant" description="Version information and credits">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Kimi Assistant</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Version 1.0.0</p>
            <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <p>Built with React, TypeScript, Tailwind CSS, and Zustand</p>
              <p>Powered by Kimi K3 via OpenRouter</p>
              <p>Local-first: all data stored in your browser</p>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-400">
                Your data never leaves your browser. No account required.
              </p>
            </div>
          </div>
        </SettingsSection>
      )}
    </div>
  )
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="card">{children}</div>
    </div>
  )
}

function SettingItem({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  )
}