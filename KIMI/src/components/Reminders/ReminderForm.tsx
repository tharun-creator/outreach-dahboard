import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import type { Reminder, Client } from '../../types'

interface ReminderFormProps {
  reminder: Reminder | null
  clients: Client[]
  onClose: () => void
  onSubmit: (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>, isEdit: boolean) => void
}

const typeOptions: Reminder['type'][] = ['follow_up', 'meeting', 'call', 'email', 'task', 'heads_up']
const priorityOptions: Reminder['priority'][] = ['low', 'medium', 'high', 'urgent']

export function ReminderForm({ reminder, clients, onClose, onSubmit }: ReminderFormProps) {
  const isEdit = !!reminder
  const [formData, setFormData] = useState<Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    type: 'follow_up',
    priority: 'medium',
    status: 'pending',
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    clientId: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description || '',
        type: reminder.type,
        priority: reminder.priority,
        status: reminder.status,
        dueAt: reminder.dueAt.slice(0, 16),
        clientId: reminder.clientId || '',
      })
    }
  }, [reminder])

  const validate = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.dueAt) newErrors.dueAt = 'Due date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData, isEdit)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit Reminder' : 'Add Reminder'}
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
              placeholder="Follow up with Acme Corp"
            />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="textarea"
              placeholder="Details about this reminder..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as Reminder['type'] }))}
                className="input"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as Reminder['priority'] }))}
                className="input"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueAt" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Due Date & Time *
              </label>
              <input
                id="dueAt"
                type="datetime-local"
                value={formData.dueAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueAt: e.target.value }))}
                className={cn('input', errors.dueAt && 'border-red-500 focus:border-red-500')}
              />
              {errors.dueAt && <p className="mt-1 text-sm text-red-500">{errors.dueAt}</p>}
            </div>
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Client (optional)
              </label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
                className="input"
              >
                <option value="">None</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Reminder['status'] }))}
                className="input"
              >
                <option value="pending">Pending</option>
                <option value="snoozed">Snoozed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}