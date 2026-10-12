import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Meeting, Client } from '../../types'

interface MeetingFormProps {
  meeting: Meeting | null
  clients: Client[]
  onClose: () => void
  onSubmit: (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>, isEdit: boolean) => void
}

const typeOptions: Meeting['type'][] = ['discovery', 'demo', 'proposal', 'negotiation', 'onboarding', 'check_in', 'other']
const durationOptions = [15, 30, 45, 60, 90, 120]

export function MeetingForm({ meeting, clients, onClose, onSubmit }: MeetingFormProps) {
  const isEdit = !!meeting
  const [formData, setFormData] = useState<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    clientId: '',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    duration: 30,
    type: 'discovery',
    status: 'scheduled',
    location: '',
    meetingLink: '',
    agenda: [''],
    notes: '',
    actionItems: [],
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})

  useEffect(() => {
    if (meeting) {
      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        clientId: meeting.clientId,
        scheduledAt: meeting.scheduledAt.slice(0, 16),
        duration: meeting.duration,
        type: meeting.type,
        status: meeting.status,
        location: meeting.location || '',
        meetingLink: meeting.meetingLink || '',
        agenda: meeting.agenda.length > 0 ? [...meeting.agenda] : [''],
        notes: meeting.notes || '',
        actionItems: meeting.actionItems.length > 0 ? [...meeting.actionItems] : [],
      })
    }
  }, [meeting])

  const validate = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.clientId) newErrors.clientId = 'Client is required'
    if (!formData.scheduledAt) newErrors.scheduledAt = 'Date & time is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      // Filter empty agenda items
      const cleanAgenda = formData.agenda.filter((item) => item.trim())
      onSubmit({ ...formData, agenda: cleanAgenda.length > 0 ? cleanAgenda : [''] }, isEdit)
    }
  }

  const addAgendaItem = () => {
    setFormData((prev) => ({ ...prev, agenda: [...prev.agenda, ''] }))
  }

  const removeAgendaItem = (index: number) => {
    setFormData((prev) => ({ ...prev, agenda: prev.agenda.filter((_, i) => i !== index) }))
  }

  const addActionItem = () => {
    const newItem = {
      id: `temp-${Date.now()}`,
      text: '',
      assignee: '',
      dueAt: '',
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setFormData((prev) => ({ ...prev, actionItems: [...prev.actionItems, newItem] }))
  }

  const removeActionItem = (id: string) => {
    setFormData((prev) => ({ ...prev, actionItems: prev.actionItems.filter((item) => item.id !== id) }))
  }

  const updateActionItem = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const toggleActionComplete = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: prev.actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit Meeting' : 'Schedule Meeting'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className={cn('input', errors.title && 'border-red-500 focus:border-red-500')}
              placeholder="Discovery call with Acme Corp"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Client *
            </label>
            <select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
              className={cn('input', errors.clientId && 'border-red-500 focus:border-red-500')}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.company})
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Date & Time *
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className={cn('input', errors.scheduledAt && 'border-red-500 focus:border-red-500')}
              />
              {errors.scheduledAt && <p className="mt-1 text-sm text-red-500">{errors.scheduledAt}</p>}
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Duration (minutes)
              </label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) }))}
                className="input"
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Meeting Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as Meeting['type'] }))}
                className="input"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {!isEdit && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Meeting['status'] }))}
                  className="input"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="input"
              placeholder="Office, Zoom, Google Meet, etc."
            />
          </div>

          <div>
            <label htmlFor="meetingLink" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Meeting Link
            </label>
            <input
              id="meetingLink"
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, meetingLink: e.target.value }))}
              className="input"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Agenda
              </label>
              <button type="button" onClick={addAgendaItem} className="btn-secondary text-sm">
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.agenda.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newAgenda = [...formData.agenda]
                      newAgenda[index] = e.target.value
                      setFormData((prev) => ({ ...prev, agenda: newAgenda }))
                    }}
                    placeholder={`Agenda item ${index + 1}`}
                    className="input flex-1"
                  />
                  {formData.agenda.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(index)}
                      className="p-2 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="Remove agenda item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Action Items
              </label>
              <button type="button" onClick={addActionItem} className="btn-secondary text-sm">
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>
            <div className="space-y-2">
              {formData.actionItems.map((item) => (
                <div key={item.id} className="card p-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleActionComplete(item.id)}
                    className="mt-1 h-4 w-4 text-brand-600 border-zinc-300 rounded focus:ring-brand-500"
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateActionItem(item.id, 'text', e.target.value)}
                      placeholder="Action item description"
                      className="input"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="text"
                        value={item.assignee}
                        onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                        placeholder="Assignee (optional)"
                        className="input w-40"
                      />
                      <input
                        type="datetime-local"
                        value={item.dueAt}
                        onChange={(e) => updateActionItem(item.id, 'dueAt', e.target.value)}
                        className="input w-48"
                      />
                      <button
                        type="button"
                        onClick={() => removeActionItem(item.id)}
                        className="p-2 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Remove action item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="textarea"
              placeholder="Meeting notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? 'Save Changes' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}