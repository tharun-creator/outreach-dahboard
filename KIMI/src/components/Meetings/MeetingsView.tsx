import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, useMeetings, useClients, useSearchQuery } from '../../store'
import { Plus, Search, MoreVertical, Trash2, CheckCircle, X, Calendar, Clock, ExternalLink, MessageSquare, Check } from 'lucide-react'
import { MeetingForm } from './MeetingForm'
import { formatDateTime, getStatusColor } from '../../lib/utils'
import type { Meeting, Client } from '../../types'

const typeLabels: Record<Meeting['type'], string> = {
  discovery: 'Discovery',
  demo: 'Demo',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  onboarding: 'Onboarding',
  check_in: 'Check-in',
  other: 'Other',
}

export function MeetingsView() {
  const meetings = useMeetings()
  const clients = useClients()
  const searchQuery = useSearchQuery()
  const addMeeting = useStore((s) => s.addMeeting)
  const updateMeeting = useStore((s) => s.updateMeeting)
  const deleteMeeting = useStore((s) => s.deleteMeeting)
  const setCurrentView = useStore((s) => s.setCurrentView)

  const [showForm, setShowForm] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Meeting['status'] | 'all'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'upcoming'>('list')

  const filteredMeetings = meetings
    .filter((meeting) => {
      if (viewMode === 'upcoming') {
        if (meeting.status !== 'scheduled') return false
        if (new Date(meeting.scheduledAt) < new Date()) return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const client = clients.find((c) => c.id === meeting.clientId)
        if (
          !meeting.title.toLowerCase().includes(query) &&
          !meeting.description?.toLowerCase().includes(query) &&
          !client?.name.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (filterStatus !== 'all' && meeting.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      if (viewMode === 'upcoming') {
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      }
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    })

  const handleSubmit = (data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>, isEdit = false) => {
    if (isEdit && editingMeeting) {
      updateMeeting(editingMeeting.id, data)
    } else {
      addMeeting(data)
    }
    setShowForm(false)
    setEditingMeeting(null)
  }

  const handleDelete = (id: string) => {
    deleteMeeting(id)
    setDeleteConfirm(null)
  }

  const stats = {
    upcoming: meetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()).length,
    thisWeek: meetings.filter((m) => {
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return m.status === 'scheduled' && new Date(m.scheduledAt) >= now && new Date(m.scheduledAt) <= weekFromNow
    }).length,
    completed: meetings.filter((m) => m.status === 'completed').length,
    total: meetings.length,
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Meetings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Schedule and track your client meetings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('upcoming')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'upcoming'
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              )}
            >
              <Calendar className="h-4 w-4 mr-1 inline" />
              Upcoming
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              )}
            >
              All Meetings
            </button>
          </div>
          <button onClick={() => { setEditingMeeting(null); setShowForm(true) }} className="btn-primary">
            <Plus className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Upcoming" value={stats.upcoming} icon={<Calendar className="h-5 w-5" />} color="text-blue-600 dark:text-blue-400" />
        <StatCard label="This Week" value={stats.thisWeek} icon={<Clock className="h-5 w-5" />} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle className="h-5 w-5" />} color="text-green-600 dark:text-green-400" />
        <StatCard label="Total" value={stats.total} icon={<MessageSquare className="h-5 w-5" />} color="text-zinc-600 dark:text-zinc-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Meeting['status'] | 'all')}
          className="input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>

      {/* Meeting List */}
      {filteredMeetings.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            {searchQuery || filterStatus !== 'all'
              ? 'No meetings found'
              : 'No meetings yet'}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'Schedule your first meeting to get started'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              client={clients.find((c) => c.id === meeting.clientId)}
              deleteConfirm={deleteConfirm}
              onEdit={() => {
                setEditingMeeting(meeting)
                setShowForm(true)
              }}
              onDelete={() => setDeleteConfirm(meeting.id)}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setDeleteConfirm(null)}
              onViewDetails={() => {
                setCurrentView('chat')
                useStore.getState().setSelectedClientId(meeting.clientId)
              }}
            />
          ))}
        </div>
      )}

      {/* Meeting Form Modal */}
      {(showForm || editingMeeting) && (
        <MeetingForm
          meeting={editingMeeting}
          clients={clients}
          onClose={() => {
            setShowForm(false)
            setEditingMeeting(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Delete meeting?</h3>
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

function MeetingCard({
  meeting,
  client,
  deleteConfirm,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onViewDetails,
}: {
  meeting: Meeting
  client: Client | undefined
  deleteConfirm: string | null
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: (id: string) => void
  onCancelDelete: () => void
  onViewDetails: () => void
}) {
  const isUpcoming = meeting.status === 'scheduled' && new Date(meeting.scheduledAt) > new Date()
  const isPast = meeting.status === 'scheduled' && new Date(meeting.scheduledAt) < new Date()

  return (
    <div
      className={cn(
        'card p-4 flex items-start gap-4 transition-colors',
        isUpcoming && 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10',
        isPast && 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10',
        meeting.status === 'completed' && 'opacity-60',
        meeting.status === 'cancelled' && 'opacity-40'
      )}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
        <Calendar className="h-6 w-6 text-brand-600 dark:text-brand-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className={cn('font-medium text-zinc-900 dark:text-zinc-100 truncate', meeting.status === 'completed' && 'line-through')}>
                {meeting.title}
              </h4>
              <span className={cn('badge', getStatusColor(meeting.status))}>{meeting.status}</span>
              <span className="badge badge-info">{typeLabels[meeting.type]}</span>
            </div>
            {meeting.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">{meeting.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(meeting.scheduledAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {meeting.duration} min
              </span>
              {client && (
                <span className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium dark:bg-brand-900/30 dark:text-brand-400">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[150px]">{client.name}</span>
                </span>
              )}
              {meeting.meetingLink && (
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Join Meeting
                </a>
              )}
            </div>
            {meeting.agenda.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Agenda</p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
                  {meeting.agenda.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                      {item}
                    </li>
                  ))}
                  {meeting.agenda.length > 3 && (
                    <li className="text-xs text-zinc-400">+{meeting.agenda.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isUpcoming && (
              <button onClick={onViewDetails} className="p-1.5 rounded text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" aria-label="Prepare for meeting">
                <MessageSquare className="h-4 w-4" />
              </button>
            )}
            {meeting.status === 'scheduled' && (
              <button onClick={onEdit} className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Edit">
                <MoreVertical className="h-4 w-4" />
              </button>
            )}
            {deleteConfirm === meeting.id ? (
              <div className="flex items-center gap-1">
                <button onClick={() => onConfirmDelete(meeting.id)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Confirm delete"><Check className="h-4 w-4" /></button>
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