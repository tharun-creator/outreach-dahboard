import { useState, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'
import type { Client } from '../../types'

interface ClientFormProps {
  client: Client | null
  onClose: () => void
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, isEdit: boolean) => void
}

export function ClientForm({ client, onClose, onSubmit }: ClientFormProps) {
  const isEdit = !!client
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    linkedin: '',
    status: 'prospect',
    tags: [],
    notes: '',
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        company: client.company,
        role: client.role,
        phone: client.phone || '',
        linkedin: client.linkedin || '',
        status: client.status,
        tags: [...client.tags],
        notes: client.notes,
      })
    }
  }, [client])

  const validate = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.company.trim()) newErrors.company = 'Company is required'
    if (!formData.role.trim()) newErrors.role = 'Role is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData, isEdit)
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!formData.tags.includes(tag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit Client' : 'Add Client'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={cn('input', errors.name && 'border-red-500 focus:border-red-500')}
                placeholder="John Doe"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className={cn('input', errors.email && 'border-red-500 focus:border-red-500')}
                placeholder="john@company.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Company *
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                className={cn('input', errors.company && 'border-red-500 focus:border-red-500')}
                placeholder="Acme Corp"
              />
              {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Role *
              </label>
              <input
                id="role"
                type="text"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className={cn('input', errors.role && 'border-red-500 focus:border-red-500')}
                placeholder="VP of Engineering"
              />
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                className="input"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as Client['status'] }))}
              className="input"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span key={tag} className="badge badge-info flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-brand-600 dark:hover:text-brand-400"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Add tag (press Enter)..."
                className="input flex-1 min-w-[150px]"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Press Enter to add tags</p>
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
              placeholder="Internal notes about this client..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}