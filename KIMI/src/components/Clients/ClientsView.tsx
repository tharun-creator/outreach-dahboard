import { useState } from 'react'
import { cn } from '../../lib/utils'
import { useStore, useClients, useSearchQuery, useSelectedClientId } from '../../store'
import { Plus, Search, Edit, Trash2, Mail, Phone, Linkedin, X, Check } from 'lucide-react'
import { ClientForm } from './ClientForm'
import { formatRelativeTime, getInitials, getStatusColor } from '../../lib/utils'
import type { Client } from '../../types'

export function ClientsView() {
  const clients = useClients()
  const searchQuery = useSearchQuery()
  const selectedClientId = useSelectedClientId()
  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const deleteClient = useStore((s) => s.deleteClient)
  const setSelectedClientId = useStore((s) => s.setSelectedClientId)
  const setCurrentView = useStore((s) => s.setCurrentView)

  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'status' | 'updatedAt'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const getSortValue = (client: Client, field: typeof sortBy) => {
    if (field === 'updatedAt') return new Date(client.updatedAt).getTime()
    return client[field]
  }

  const filteredClients = clients
    .filter((client) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        client.name.toLowerCase().includes(query) ||
        client.company.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.role.toLowerCase().includes(query) ||
        client.tags.some((t) => t.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      const aVal = getSortValue(a, sortBy)
      const bVal = getSortValue(b, sortBy)
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const handleSubmit = (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, isEdit = false) => {
    if (isEdit && editingClient) {
      updateClient(editingClient.id, data)
    } else {
      const newClient = addClient(data)
      setSelectedClientId(newClient.id)
    }
    setShowForm(false)
    setEditingClient(null)
  }

  const handleDelete = (id: string) => {
    deleteClient(id)
    if (selectedClientId === id) {
      setSelectedClientId(null)
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Clients</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your client relationships and outreach
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingClient(null)
              setShowForm(true)
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input w-auto"
            aria-label="Sort by"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="btn-secondary p-2"
            aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
          >
            <span className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-180')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 18h18M3 6h18" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="card text-center py-12">
          {searchQuery ? (
            <>
              <Search className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No clients found
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                Try adjusting your search or{' '}
                <button
                  onClick={() => useStore.getState().setSearchQuery('')}
                  className="text-brand-600 hover:text-brand-700 underline"
                >
                  clear the filter
                </button>
              </p>
            </>
          ) : (
            <>
              <Plus className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No clients yet
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Add your first client to start tracking relationships
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Last Contact
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className={cn(
                      'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors',
                      selectedClientId === client.id && 'bg-brand-50 dark:bg-brand-900/20'
                    )}
                    onClick={() => {
                      setSelectedClientId(client.id)
                      setCurrentView('chat')
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium text-sm dark:bg-brand-900/30 dark:text-brand-400">
                          {getInitials(client.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{client.name}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-zinc-900 dark:text-zinc-100 truncate max-w-xs">{client.company}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-zinc-500 dark:text-zinc-400 truncate max-w-xs">{client.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getStatusColor(client.status))}>{client.status}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {client.lastContactAt ? formatRelativeTime(client.lastContactAt) : 'Never'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {client.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${client.phone}`)
                            }}
                            className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        )}
                        {client.email && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`mailto:${client.email}`)
                            }}
                            className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                        {client.linkedin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(client.linkedin!, '_blank')
                            }}
                            className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="LinkedIn"
                          >
                            <Linkedin className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingClient(client)
                            setShowForm(true)
                          }}
                          className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          aria-label="Edit client"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {deleteConfirm === client.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              aria-label="Confirm delete"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1.5 rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              aria-label="Cancel delete"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm(client.id)
                            }}
                            className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            aria-label="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Form Modal */}
      {(showForm || editingClient) && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false)
            setEditingClient(null)
          }}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Delete client?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              This will permanently delete the client and all associated reminders and meetings. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}