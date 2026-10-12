import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, useReminders, useClients, useSearchQuery } from '../../store'
import { Plus, Search, MoreVertical, Trash2, Clock, CheckCircle, X, Calendar, Bell, Check } from 'lucide-react'
import { ReminderForm } from './ReminderForm'
import { formatRelativeTime, getStatusColor, getPriorityColor, isOverdue, isDueSoon } from '../../lib/utils'
import type { Reminder, Client } from '../../types'

export function RemindersView() {
  const reminders = useReminders()
  const clients = useClients()
  const searchQuery = useSearchQuery()
  const addReminder = useStore((s) => s.addReminder)
  const updateReminder = useStore((s) => s.updateReminder)
  const deleteReminder = useStore((s) => s.deleteReminder)
  const completeReminder = useStore((s) => s.completeReminder)
  const snoozeReminder = useStore((s) => s.snoozeReminder)

  const [showForm, setShowForm] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Reminder['status'] | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Reminder['priority'] | 'all'>('all')

  const filteredReminders = reminders
    .filter((reminder) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const client = clients.find((c) => c.id === reminder.clientId)
        if (
          !reminder.title.toLowerCase().includes(query) &&
          !reminder.description?.toLowerCase().includes(query) &&
          !client?.name.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (filterStatus !== 'all' && reminder.status !== filterStatus) return false
      if (filterPriority !== 'all' && reminder.priority !== filterPriority) return false
      return true
    })
    .sort((a, b) => {
      const aOverdue = isOverdue(a.dueAt) && a.status === 'pending'
      const bOverdue = isOverdue(b.dueAt) && b.status === 'pending'
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1

      const aDueSoon = isDueSoon(a.dueAt) && a.status === 'pending'
      const bDueSoon = isDueSoon(b.dueAt) && b.status === 'pending'
      if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1

      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })

  const handleSubmit = (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>, isEdit = false) => {
    if (isEdit && editingReminder) {
      updateReminder(editingReminder.id, data)
    } else {
      addReminder(data)
    }
    setShowForm(false)
    setEditingReminder(null)
  }

  const handleDelete = (id: string) => {
    deleteReminder(id)
    setDeleteConfirm(null)
  }

  const stats = {
    total: reminders.length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    overdue: reminders.filter((r) => r.status === 'pending' && isOverdue(r.dueAt)).length,
    dueSoon: reminders.filter((r) => r.status === 'pending' && isDueSoon(r.dueAt)).length,
    completed: reminders.filter((r) => r.status === 'completed').length,
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Reminders</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Stay on top of follow-ups and tasks
          </p>
        </div>
        <button onClick={() => { setEditingReminder(null); setShowForm(true) }} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Reminder
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} icon={<Bell className="h-5 w-5" />} color="text-zinc-600 dark:text-zinc-400" />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Overdue" value={stats.overdue} icon={<Clock className="h-5 w-5" />} color="text-red-600 dark:text-red-400" />
        <StatCard label="Due Soon" value={stats.dueSoon} icon={<Calendar className="h-5 w-5" />} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="h-5 w-5" />} color="text-green-600 dark:text-green-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Reminder['status'] | 'all')}
          className="input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="snoozed">Snoozed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Reminder['priority'] | 'all')}
          className="input w-auto"
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Reminder List */}
      {filteredReminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'No reminders found'
              : 'No reminders yet'}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first reminder to stay organized'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterPriority === 'all' && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Reminder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              client={clients.find((c) => c.id === reminder.clientId)}
              deleteConfirm={deleteConfirm}
              onEdit={() => {
                setEditingReminder(reminder)
                setShowForm(true)
              }}
              onDelete={() => setDeleteConfirm(reminder.id)}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setDeleteConfirm(null)}
              onComplete={() => completeReminder(reminder.id)}
              onSnooze={(minutes) => snoozeReminder(reminder.id, minutes)}
            />
          ))}
        </div>
      )}

      {/* Reminder Form Modal */}
      {(showForm || editingReminder) && (
        <ReminderForm
          reminder={editingReminder}
          clients={clients}
          onClose={() => {
            setShowForm(false)
            setEditingReminder(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Delete reminder?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
        <div className={cn('p-2 rounded-lg', color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')) + '/10'}>
          <span className={cn(color)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function ReminderCard({
  reminder,
  client,
  deleteConfirm,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onComplete,
  onSnooze,
}: {
  reminder: Reminder
  client: Client | undefined
  deleteConfirm: string | null
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  onComplete: () => void
  onSnooze: (minutes: number) => void
}) {
  const overdue = isOverdue(reminder.dueAt) && reminder.status === 'pending'
  const dueSoon = isDueSoon(reminder.dueAt) && reminder.status === 'pending'
  const snoozed = reminder.status === 'snoozed' && reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date()

  return (
    <div
      className={cn(
        'card p-4 flex items-start gap-4 transition-colors',
        overdue && 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10',
        dueSoon && 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10',
        reminder.status === 'completed' && 'opacity-60',
        snoozed && 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10'
      )}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">
        <span className={cn('text-xl font-bold', getPriorityColor(reminder.priority).replace('badge ', 'text-').replace('bg-', 'bg-opacity-10 '))}>
          {reminder.priority.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className={cn('font-medium text-zinc-900 dark:text-zinc-100 truncate', reminder.status === 'completed' && 'line-through')}>
                {reminder.title}
              </h4>
              <span className={cn('badge', getStatusColor(reminder.status))}>{reminder.status}</span>
              <span className={cn('badge', getPriorityColor(reminder.priority))}>{reminder.priority}</span>
              {reminder.type !== 'task' && (
                <span className="badge badge-info">{reminder.type.replace('_', ' ')}</span>
              )}
            </div>
            {reminder.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">{reminder.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(reminder.dueAt)}
                {overdue && <span className="text-red-500 font-medium">(OVERDUE)</span>}
                {dueSoon && !overdue && <span className="text-amber-500 font-medium">(DUE SOON)</span>}
              </span>
              {client && (
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium dark:bg-brand-900/30 dark:text-brand-400">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[150px]">{client.name}</span>
                </span>
              )}
              {reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date() && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <Bell className="h-3.5 w-3.5" />
                  Snoozed until {formatRelativeTime(reminder.snoozedUntil)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {reminder.status === 'pending' && (
              <>
                <button onClick={onComplete} className="p-1.5 rounded text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" aria-label="Complete">
                  <CheckCircle className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => onSnooze(15)}
                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    aria-label="Snooze 15 min"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 min-w-[120px] hidden group-hover:block z-10">
                    {[
                      { label: '15 min', minutes: 15 },
                      { label: '1 hour', minutes: 60 },
                      { label: '4 hours', minutes: 240 },
                      { label: 'Tomorrow', minutes: 1440 },
                    ].map((opt) => (
                      <button
                        key={opt.minutes}
                        onClick={() => onSnooze(opt.minutes)}
                        className="w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <button onClick={onEdit} className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Edit">
              <MoreVertical className="h-4 w-4" />
            </button>
            {deleteConfirm === reminder.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => onConfirmDelete(reminder.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Confirm delete"><Check className="h-4 w-4" /></button>
                <button onClick={onCancelDelete} className="p-1.5 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Cancel"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button onClick={onDelete} className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}