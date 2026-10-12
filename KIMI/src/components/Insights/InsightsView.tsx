import { cn } from '../../lib/utils'
import { useClients, useReminders, useMeetings } from '../../store'
import { TrendingUp, Users, Clock, CheckCircle, Calendar, Target } from 'lucide-react'
import { formatDate, isOverdue, isDueSoon } from '../../lib/utils'

export function InsightsView() {
  const clients = useClients()
  const reminders = useReminders()
  const meetings = useMeetings()

  // Calculate metrics
  const activeClients = clients.filter((c) => c.status === 'active').length
  const prospectClients = clients.filter((c) => c.status === 'prospect').length
  const pendingReminders = reminders.filter((r) => r.status === 'pending').length
  const overdueReminders = reminders.filter((r) => r.status === 'pending' && isOverdue(r.dueAt)).length
  const dueSoonReminders = reminders.filter((r) => r.status === 'pending' && isDueSoon(r.dueAt)).length
  const completedReminders = reminders.filter((r) => r.status === 'completed').length
  const upcomingMeetings = meetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()).length
  const completedMeetings = meetings.filter((m) => m.status === 'completed').length

  // Weekly activity
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentReminders = reminders.filter((r) => new Date(r.createdAt) >= weekAgo).length
  const recentMeetings = meetings.filter((m) => new Date(m.createdAt) >= weekAgo).length
  const recentClients = clients.filter((c) => new Date(c.createdAt) >= weekAgo).length

  // Client status distribution
  const statusCounts = clients.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Reminder type distribution
  const typeCounts = reminders.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Meeting type distribution
  const meetingTypeCounts = meetings.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Insights</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Overview of your outreach activity and pipeline
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Active Clients"
          value={activeClients}
          change={prospectClients}
          changeLabel="prospects"
          icon={<Users className="h-5 w-5" />}
          color="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Pending Reminders"
          value={pendingReminders}
          change={overdueReminders}
          changeLabel="overdue"
          icon={<Clock className="h-5 w-5" />}
          color="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="Upcoming Meetings"
          value={upcomingMeetings}
          change={completedMeetings}
          changeLabel="completed"
          icon={<Calendar className="h-5 w-5" />}
          color="text-green-600 dark:text-green-400"
        />
        <MetricCard
          label="Completed Tasks"
          value={completedReminders}
          change={dueSoonReminders}
          changeLabel="due soon"
          icon={<CheckCircle className="h-5 w-5" />}
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ActivityCard
          title="This Week"
          items={[
            { label: 'New reminders created', value: recentReminders, icon: <Clock className="h-4 w-4" /> },
            { label: 'Meetings scheduled', value: recentMeetings, icon: <Calendar className="h-4 w-4" /> },
            { label: 'New clients added', value: recentClients, icon: <Users className="h-4 w-4" /> },
          ]}
        />
        <ActivityCard
          title="Client Pipeline"
          items={Object.entries(statusCounts).map(([status, count]) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            icon: <Target className="h-4 w-4" />,
          }))}
        />
        <ActivityCard
          title="Reminder Types"
          items={Object.entries(typeCounts).map(([type, count]) => ({
            label: type.replace('_', ' '),
            value: count,
            icon: <Target className="h-4 w-4" />,
          }))}
        />
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Meeting Types</h3>
          <div className="space-y-3">
            {Object.entries(meetingTypeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32 capitalize">{type}</span>
                <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${meetingTypeCounts ? (count / Math.max(...Object.values(meetingTypeCounts))) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Upcoming Schedule</h3>
          <div className="space-y-3">
            {meetings
              .filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date())
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .slice(0, 5)
              .map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{meeting.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(meeting.scheduledAt)} at {new Date(meeting.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="badge badge-info">{meeting.type.replace('_', ' ')}</span>
                </div>
              ))}
            {meetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date()).length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">No upcoming meetings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color,
}: {
  label: string
  value: number
  change: number
  changeLabel: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{value}</p>
        </div>
        <div className={cn('p-3 rounded-xl', color.replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')) + '/10'}>
          <span className={cn(color)}>{icon}</span>
        </div>
      </div>
      {change > 0 && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          {change} {changeLabel}
        </p>
      )}
    </div>
  )
}

function ActivityCard({
  title,
  items,
}: {
  title: string
  items: { label: string; value: number; icon: React.ReactNode }[]
}) {
  return (
    <div className="card p-4">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                {item.icon}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{item.label}</span>
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}