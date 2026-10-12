import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { formatTime } from '../lib/utils'

export function useNotificationChecker() {
  const { checkDueReminders, checkUpcomingMeetings, addNotification, preferences } = useStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notifiedRemindersRef = useRef<Set<string>>(new Set())
  const notifiedMeetingsRef = useRef<Set<string>>(new Set())

  const checkAndNotify = useCallback(() => {
    if (!preferences.notificationsEnabled) return

    // Check due reminders
    const dueReminders = checkDueReminders()
    dueReminders.forEach((reminder) => {
      if (!notifiedRemindersRef.current.has(reminder.id)) {
        notifiedRemindersRef.current.add(reminder.id)
        addNotification({
          type: 'reminder',
          title: `${reminder.type.replace('_', ' ')} Due: ${reminder.title}`,
          message: reminder.description || `Was due at ${formatTime(reminder.dueAt)}`,
          priority: reminder.priority,
          read: false,
          relatedId: reminder.id,
        })
        if (preferences.soundEnabled) playNotificationSound()
      }
    })

    // Check upcoming meetings
    const upcomingMeetings = checkUpcomingMeetings()
    upcomingMeetings.forEach((meeting) => {
      if (!notifiedMeetingsRef.current.has(meeting.id)) {
        notifiedMeetingsRef.current.add(meeting.id)
        addNotification({
          type: 'meeting',
          title: `Meeting Starting Soon: ${meeting.title}`,
          message: `With ${getClientName(meeting.clientId)} at ${formatTime(meeting.scheduledAt)}`,
          priority: 'high',
          read: false,
          relatedId: meeting.id,
        })
        if (preferences.soundEnabled) playNotificationSound()
      }
    })

    // Clean up old notified IDs (keep last 50)
    if (notifiedRemindersRef.current.size > 50) {
      const arr = Array.from(notifiedRemindersRef.current)
      notifiedRemindersRef.current = new Set(arr.slice(-50))
    }
    if (notifiedMeetingsRef.current.size > 50) {
      const arr = Array.from(notifiedMeetingsRef.current)
      notifiedMeetingsRef.current = new Set(arr.slice(-50))
    }
  }, [checkDueReminders, checkUpcomingMeetings, addNotification, preferences])

  useEffect(() => {
    // Initial check
    checkAndNotify()

    // Check every minute
    intervalRef.current = setInterval(checkAndNotify, 60000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkAndNotify])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
}

function getClientName(clientId: string): string {
  const client = useStore.getState().getClient(clientId)
  return client?.name || 'Unknown Client'
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch {
    // Ignore audio errors
  }
}

export function useBrowserNotifications() {
  const { notifications, markNotificationRead, preferences } = useStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!preferences.notificationsEnabled) return
    if ('Notification' in window && Notification.permission === 'granted' && unreadCount > 0) {
      // Only show for the most recent unread
      const latestUnread = notifications.find((n) => !n.read)
      if (latestUnread) {
        const notification = new Notification(latestUnread.title, {
          body: latestUnread.message,
          icon: '/favicon.svg',
          tag: latestUnread.id,
        })

        notification.onclick = () => {
          window.focus()
          markNotificationRead(latestUnread.id)
          if (latestUnread.actionUrl) {
            window.location.hash = latestUnread.actionUrl
          }
        }
      }
    }
  }, [unreadCount, notifications, preferences.notificationsEnabled, markNotificationRead])
}