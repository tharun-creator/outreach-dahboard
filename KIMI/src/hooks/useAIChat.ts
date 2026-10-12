import { useCallback, useRef, useState } from 'react'
import { useStore, useClients, useReminders, useMeetings, useSelectedClientId } from '../store'
import { formatDate, formatDateTime } from '../lib/utils'

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const MODEL = 'moonshotai/kimi-k3'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface AIResponse {
  content: string
  reasoning?: string
}

export function useAIChat() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const addChatMessage = useStore((s) => s.addChatMessage)
  const clients = useClients()
  const reminders = useReminders()
  const meetings = useMeetings()
  const selectedClientId = useSelectedClientId()

  const buildContext = useCallback((): string => {
    const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null

    let context = `You are Kimi, a personal AI assistant for outreach and client management. 
You help with tasks, follow-ups, meeting prep, and client insights.

Current context:
- Total clients: ${clients.length}
- Active reminders: ${reminders.filter((r) => r.status === 'pending').length}
- Upcoming meetings: ${meetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()).length}
`

    if (selectedClient) {
      const clientReminders = reminders.filter((r) => r.clientId === selectedClient.id && r.status === 'pending')
      const clientMeetings = meetings.filter((m) => m.clientId === selectedClient.id)
      const completedMeetings = clientMeetings.filter((m) => m.status === 'completed')
      const upcomingMeetings = clientMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date())

      context += `
Selected Client: ${selectedClient.name}
- Email: ${selectedClient.email}
- Company: ${selectedClient.company}
- Role: ${selectedClient.role}
- Status: ${selectedClient.status}
- Tags: ${selectedClient.tags.join(', ') || 'none'}
- Notes: ${selectedClient.notes || 'none'}
- Last contact: ${selectedClient.lastContactAt ? formatDate(selectedClient.lastContactAt) : 'never'}
- Next follow-up: ${selectedClient.nextFollowUpAt ? formatDate(selectedClient.nextFollowUpAt) : 'not scheduled'}

Pending reminders for this client:
${clientReminders.length > 0
  ? clientReminders.map((r) => `  - ${r.type}: ${r.title} (due ${formatDateTime(r.dueAt)}, ${r.priority} priority)`).join('\n')
  : '  None'}

Upcoming meetings:
${upcomingMeetings.length > 0
  ? upcomingMeetings.map((m) => `  - ${m.title} on ${formatDateTime(m.scheduledAt)} (${m.type})`).join('\n')
  : '  None'}

Recent completed meetings:
${completedMeetings.slice(-3).length > 0
  ? completedMeetings.slice(-3).map((m) => `  - ${m.title} on ${formatDate(m.scheduledAt)}: ${m.notes || 'no notes'}`).join('\n')
  : '  None'}
`
    }

    context += `
Instructions:
- Be concise and actionable
- When asked about a client, use the context above
- Suggest specific next steps (follow-ups, meetings, emails)
- If creating reminders/meetings, explain what to create
- Format responses with clear sections when helpful
- Use markdown for formatting
`

    return context
  }, [clients, reminders, meetings, selectedClientId])

  const sendMessage = useCallback(
    async (content: string): Promise<AIResponse> => {
      if (isLoading) return { content: '', reasoning: '' }

      setIsLoading(true)
      setError(null)

      // Add user message
      addChatMessage({ role: 'user', content, clientId: selectedClientId || undefined })

      // Build messages for API
      const messages = useStore.getState().chatMessages
      const context = buildContext()

      const apiMessages = [
        { role: 'system' as const, content: context },
        ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      ]

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL,
            messages: apiMessages,
            reasoning: { enabled: true },
            max_tokens: 2000,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error?.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        const choice = data.choices[0]
        const content = choice.message.content || ''
        const reasoning = choice.message.reasoning || ''

        // Add assistant message
        addChatMessage({
          role: 'assistant',
          content,
          reasoning: reasoning || undefined,
          clientId: selectedClientId || undefined,
        })

        return { content, reasoning }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return { content: '', reasoning: '' }
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        return { content: '', reasoning: '' }
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, addChatMessage, buildContext, selectedClientId]
  )

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    sendMessage,
    cancel,
    isLoading,
    error,
    clearError,
  }
}