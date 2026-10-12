import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Client,
  Reminder,
  Meeting,
  ChatMessage,
  Notification,
  UserPreferences,
  ViewType,
  AppState,
} from '../types'

const STORAGE_KEY = 'kimi-assistant-storage'

interface Store extends AppState {
  clients: Client[]
  reminders: Reminder[]
  meetings: Meeting[]
  chatMessages: ChatMessage[]
  notifications: Notification[]
  preferences: UserPreferences

  // Client actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void
  getClient: (id: string) => Client | undefined
  getClients: (filter?: Partial<Client>) => Client[]

  // Reminder actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Reminder
  updateReminder: (id: string, updates: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  getReminder: (id: string) => Reminder | undefined
  getReminders: (filter?: Partial<Reminder>) => Reminder[]
  completeReminder: (id: string) => void
  snoozeReminder: (id: string, minutes: number) => void

  // Meeting actions
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Meeting
  updateMeeting: (id: string, updates: Partial<Meeting>) => void
  deleteMeeting: (id: string) => void
  getMeeting: (id: string) => Meeting | undefined
  getMeetings: (filter?: Partial<Meeting>) => Meeting[]
  getUpcomingMeetings: (days?: number) => Meeting[]

  // Chat actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage
  clearChatHistory: (clientId?: string) => void

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Notification
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  getUnreadNotifications: () => Notification[]

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void

  // UI actions
  setCurrentView: (view: ViewType) => void
  setSelectedClientId: (id: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void

  // Utility
  generateId: () => string
  checkDueReminders: () => Reminder[]
  checkUpcomingMeetings: () => Meeting[]
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notificationsEnabled: true,
  soundEnabled: true,
  autoSnoozeMinutes: 15,
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

const defaultState: AppState = {
  currentView: 'chat',
  selectedClientId: null,
  sidebarOpen: true,
  searchQuery: '',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const createStore = (set: (partial: Store | Partial<Store> | ((state: Store) => Store | Partial<Store>), replace?: false) => void, get: () => Store) => ({
  ...defaultState,
  clients: [] as Client[],
  reminders: [] as Reminder[],
  meetings: [] as Meeting[],
  chatMessages: [] as ChatMessage[],
  notifications: [] as Notification[],
  preferences: defaultPreferences,

  // Client actions
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const client: Client = {
      ...clientData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    set((state: Store) => ({ clients: [...state.clients, client] }))
    return client
  },

  updateClient: (id: string, updates: Partial<Client>) => {
    set((state: Store) => ({
      clients: state.clients.map((c: Client) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }))
  },

  deleteClient: (id: string) => {
    set((state: Store) => ({
      clients: state.clients.filter((c: Client) => c.id !== id),
      reminders: state.reminders.filter((r: Reminder) => r.clientId !== id),
      meetings: state.meetings.filter((m: Meeting) => m.clientId !== id),
    }))
  },

  getClient: (id: string) => get().clients.find((c: Client) => c.id === id),

  getClients: (filter?: Partial<Client>) => {
    const clients = get().clients
    if (!filter) return clients
    return clients.filter((c: Client) => Object.entries(filter).every(([k, v]) => c[k as keyof Client] === v))
  },

  // Reminder actions
  addReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const reminder: Reminder = {
      ...reminderData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    set((state: Store) => ({ reminders: [...state.reminders, reminder] }))

    if (reminder.priority === 'high' || reminder.priority === 'urgent') {
      get().addNotification({
        type: 'reminder',
        title: `New ${reminder.type.replace('_', ' ')}: ${reminder.title}`,
        message: reminder.description || `Due ${new Date(reminder.dueAt).toLocaleString()}`,
        priority: reminder.priority,
        read: false,
        relatedId: reminder.id,
      })
    }

    return reminder
  },

  updateReminder: (id: string, updates: Partial<Reminder>) => {
    set((state: Store) => ({
      reminders: state.reminders.map((r: Reminder) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      ),
    }))
  },

  deleteReminder: (id: string) => {
    set((state: Store) => ({
      reminders: state.reminders.filter((r: Reminder) => r.id !== id),
    }))
  },

  getReminder: (id: string) => get().reminders.find((r: Reminder) => r.id === id),

  getReminders: (filter?: Partial<Reminder>) => {
    const reminders = get().reminders
    if (!filter) return reminders
    return reminders.filter((r: Reminder) => Object.entries(filter).every(([k, v]) => r[k as keyof Reminder] === v))
  },

  completeReminder: (id: string) => {
    set((state: Store) => ({
      reminders: state.reminders.map((r: Reminder) =>
        r.id === id
          ? { ...r, status: 'completed', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : r
      ),
    }))
  },

  snoozeReminder: (id: string, minutes: number) => {
    const reminder = get().getReminder(id)
    if (!reminder) return
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    set((state: Store) => ({
      reminders: state.reminders.map((r: Reminder) =>
        r.id === id ? { ...r, status: 'snoozed', snoozedUntil, updatedAt: new Date().toISOString() } : r
      ),
    }))
  },

  // Meeting actions
  addMeeting: (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const meeting: Meeting = {
      ...meetingData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    set((state: Store) => ({ meetings: [...state.meetings, meeting] }))
    return meeting
  },

  updateMeeting: (id: string, updates: Partial<Meeting>) => {
    set((state: Store) => ({
      meetings: state.meetings.map((m: Meeting) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
    }))
  },

  deleteMeeting: (id: string) => {
    set((state: Store) => ({
      meetings: state.meetings.filter((m: Meeting) => m.id !== id),
    }))
  },

  getMeeting: (id: string) => get().meetings.find((m: Meeting) => m.id === id),

  getMeetings: (filter?: Partial<Meeting>) => {
    const meetings = get().meetings
    if (!filter) return meetings
    return meetings.filter((m: Meeting) => Object.entries(filter).every(([k, v]) => m[k as keyof Meeting] === v))
  },

  getUpcomingMeetings: (days = 7) => {
    const now = new Date()
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    return get()
      .meetings.filter(
        (m: Meeting) =>
          m.status === 'scheduled' &&
          new Date(m.scheduledAt) >= now &&
          new Date(m.scheduledAt) <= future
      )
      .sort((a: Meeting, b: Meeting) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  },

  // Chat actions
  addChatMessage: (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const message: ChatMessage = {
      ...messageData,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }
    set((state: Store) => ({ chatMessages: [...state.chatMessages, message] }))
    return message
  },

  clearChatHistory: (clientId?: string) => {
    set((state: Store) => ({
      chatMessages: clientId
        ? state.chatMessages.filter((m: ChatMessage) => m.clientId !== clientId)
        : [],
    }))
  },

  // Notification actions
  addNotification: (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const notification: Notification = {
      ...notificationData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    set((state: Store) => ({ notifications: [notification, ...state.notifications].slice(0, 100) }))
    return notification
  },

  markNotificationRead: (id: string) => {
    set((state: Store) => ({
      notifications: state.notifications.map((n: Notification) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllNotificationsRead: () => {
    set((state: Store) => ({
      notifications: state.notifications.map((n: Notification) => ({ ...n, read: true })),
    }))
  },

  getUnreadNotifications: () => get().notifications.filter((n: Notification) => !n.read),

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => {
    set((state: Store) => ({
      preferences: { ...state.preferences, ...prefs },
    }))
  },

  // UI actions
  setCurrentView: (view: ViewType) => set({ currentView: view }),
  setSelectedClientId: (id: string | null) => set({ selectedClientId: id }),
  toggleSidebar: () => set((state: Store) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // Utility
  generateId,

  checkDueReminders: () => {
    const now = new Date()
    return get().reminders.filter(
      (r: Reminder) =>
        r.status === 'pending' &&
        new Date(r.dueAt) <= now &&
        (!r.snoozedUntil || new Date(r.snoozedUntil) <= now)
    )
  },

  checkUpcomingMeetings: () => {
    const now = new Date()
    const in30Min = new Date(now.getTime() + 30 * 60 * 1000)
    return get().meetings.filter(
      (m: Meeting) =>
        m.status === 'scheduled' &&
        new Date(m.scheduledAt) >= now &&
        new Date(m.scheduledAt) <= in30Min
    )
  },
})

export const useStore = create<Store>()(
  persist(
    createStore,
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        clients: state.clients,
        reminders: state.reminders,
        meetings: state.meetings,
        chatMessages: state.chatMessages,
        notifications: state.notifications,
        preferences: state.preferences,
        currentView: state.currentView,
        selectedClientId: state.selectedClientId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Selectors for performance
export const useClients = () => useStore((s) => s.clients)
export const useReminders = () => useStore((s) => s.reminders)
export const useMeetings = () => useStore((s) => s.meetings)
export const useChatMessages = () => useStore((s) => s.chatMessages)
export const useNotifications = () => useStore((s) => s.notifications)
export const usePreferences = () => useStore((s) => s.preferences)
export const useCurrentView = () => useStore((s) => s.currentView)
export const useSelectedClientId = () => useStore((s) => s.selectedClientId)
export const useSidebarOpen = () => useStore((s) => s.sidebarOpen)
export const useSearchQuery = () => useStore((s) => s.searchQuery)