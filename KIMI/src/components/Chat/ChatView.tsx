import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { marked } from 'marked'
import { cn } from '../../lib/utils'
import { useStore, useChatMessages, useSelectedClientId } from '../../store'
import { useAIChat } from '../../hooks/useAIChat'
import { Send, Bot, Brain, ChevronDown, ChevronUp, Copy, Loader2 } from 'lucide-react'
import type { Client } from '../../types'

marked.setOptions({ breaks: true, gfm: true })

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  timestamp: string
  clientId?: string
}

export function ChatView() {
  const [input, setInput] = useState('')
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const messages = useChatMessages()
  const selectedClientId = useSelectedClientId()
  const selectedClient = useMemo(() => {
    const state = useStore.getState()
    if (!state.selectedClientId) return null
    return state.clients.find((c) => c.id === state.selectedClientId) ?? null
  }, [selectedClientId]) as Client | null
  const { sendMessage, isLoading, error } = useAIChat()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const text = input.trim()
    setInput('')
    textareaRef.current?.style.setProperty('height', 'auto')

    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (selectedClient) {
    return (
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto w-full">
        {/* Client Context Header */}
        <div className="mb-4 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium dark:bg-brand-900/30 dark:text-brand-400">
              {selectedClient.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{selectedClient.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {selectedClient.company} • {selectedClient.role}
              </p>
            </div>
            <button
              onClick={() => useStore.getState().setSelectedClientId(null)}
              className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors"
              aria-label="Clear client context"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto w-full">
      {/* Welcome State */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-in">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-6">
            <Bot className="h-8 w-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            How can I help you today?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
            Ask me about clients, create reminders, prepare for meetings, or just chat. Select a client from the
            sidebar for context-aware assistance.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'Show me overdue follow-ups',
              'Prepare for my next meeting',
              'Create a reminder for Acme Corp',
              'Summarize recent activity',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                disabled={isLoading}
                className="btn-secondary text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-thin">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showReasoning={showReasoning[message.id] || false}
            onToggleReasoning={() => setShowReasoning((prev) => ({ ...prev, [message.id]: !prev[message.id] }))}
            onCopy={() => copyToClipboard(message.content)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <span className="flex-1 text-sm">{error}</span>
            <button onClick={() => useStore.getState().updatePreferences({})} className="text-white hover:text-zinc-200">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={autoResize}
              placeholder={selectedClientId ? `Ask about ${(selectedClient as Client | null)?.name}...` : 'Message Kimi...'}
              rows={1}
              className="input pr-12 min-h-[48px] max-h-[150px]"
              disabled={isLoading}
              aria-label="Chat input"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3 bottom-3 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label="Clear input"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? 'Sending...' : 'Send message'}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line. Powered by Kimi K3 via OpenRouter.
        </p>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
  showReasoning,
  onToggleReasoning,
  onCopy,
}: {
  message: Message
  showReasoning: boolean
  onToggleReasoning: () => void
  onCopy: () => void
}) {
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={cn('flex gap-3 animate-in', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          isUser
            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
            : 'bg-brand-600 text-white'
        )}
      >
        {isUser ? 'U' : 'K'}
      </div>
      <div className={cn('flex-1 min-w-0 max-w-[calc(100%-80px)]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-zinc-900 text-white rounded-tr-lg dark:bg-zinc-100 dark:text-zinc-900'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-lg'
          )}
        >
          <div className="markdown-content prose prose-sm dark:prose-invert max-w-none">
            {message.role === 'assistant' ? (
              <div dangerouslySetInnerHTML={{ __html: marked.parse(message.content) }} />
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Reasoning */}
          {message.reasoning && (
            <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <button
                onClick={onToggleReasoning}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>{showReasoning ? 'Hide' : 'Show'} reasoning</span>
                {showReasoning ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showReasoning && (
                <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {message.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{time}</span>
            {!isUser && (
              <button
                onClick={onCopy}
                className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Copy message"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}