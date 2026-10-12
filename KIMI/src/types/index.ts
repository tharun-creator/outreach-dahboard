export interface Client {
  id: string
  name: string
  email: string
  company: string
  role: string
  phone?: string
  linkedin?: string
  status: 'active' | 'prospect' | 'inactive' | 'churned'
  tags: string[]
  notes: string
  createdAt: string
  updatedAt: string
  lastContactAt?: string
  nextFollowUpAt?: string
}

export interface Reminder {
  id: string
  title: string
  description?: string
  type: 'follow_up' | 'meeting' | 'call' | 'email' | 'task' | 'heads_up'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'completed' | 'snoozed' | 'dismissed'
  dueAt: string
  snoozedUntil?: string
  clientId?: string
  meetingId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  clientId: string
  scheduledAt: string
  duration: number // minutes
  type: 'discovery' | 'demo' | 'proposal' | 'negotiation' | 'onboarding' | 'check_in' | 'other'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  location?: string
  meetingLink?: string
  agenda: string[]
  notes: string
  actionItems: ActionItem[]
  createdAt: string
  updatedAt: string
}

export interface ActionItem {
  id: string
  text: string
  assignee?: string
  dueAt?: string
  completed: boolean
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  timestamp: string
  clientId?: string // for context-aware responses
}

export interface Notification {
  id: string
  type: 'reminder' | 'heads_up' | 'follow_up' | 'meeting' | 'ai_insight'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  read: boolean
  actionUrl?: string
  relatedId?: string // reminderId, meetingId, clientId
  createdAt: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
  soundEnabled: boolean
  autoSnoozeMinutes: number
  workingHoursStart: string // HH:mm
  workingHoursEnd: string // HH:mm
  timezone: string
}

export type ViewType = 'chat' | 'clients' | 'reminders' | 'meetings' | 'insights' | 'settings'

export interface AppState {
  currentView: ViewType
  selectedClientId: string | null
  sidebarOpen: boolean
  searchQuery: string
}