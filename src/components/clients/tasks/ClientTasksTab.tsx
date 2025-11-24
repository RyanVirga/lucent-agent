'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, X } from 'lucide-react'
import type { ClientTask } from '@/types/clients'

interface ClientTasksTabProps {
  clientId: string
}

export function ClientTasksTab({ clientId }: ClientTasksTabProps) {
  const [tasks, setTasks] = useState<{
    overdue: ClientTask[]
    dueThisWeek: ClientTask[]
    later: ClientTask[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    owner_type: 'agent' as 'agent' | 'client' | 'lender' | 'escrow',
    is_internal: false,
  })

  useEffect(() => {
    fetchTasks()
  }, [clientId])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/agent/clients/${clientId}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/agent/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })
      if (!response.ok) throw new Error('Failed to update task')
      await fetchTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      alert('Failed to update task')
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch(`/api/agent/clients/${clientId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          deal_id: null,
        }),
      })
      if (!response.ok) throw new Error('Failed to create task')
      setNewTask({ title: '', description: '', due_date: '', owner_type: 'agent', is_internal: false })
      setShowCreateForm(false)
      await fetchTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    )
  }

  if (!tasks) {
    return <div className="text-text-secondary">Failed to load tasks</div>
  }

  const TaskItem = ({ task }: { task: ClientTask }) => {
    const isCompleted = !!task.task.completed_at
    return (
      <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-border/50 hover:shadow-md transition-all">
        <button
          onClick={() => handleToggleTask(task.task.id, isCompleted)}
          className="mt-0.5 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300 hover:text-accent" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
            {task.task.title}
          </div>
          {task.task.description && (
            <div className="text-sm text-text-secondary mt-1">{task.task.description}</div>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
            <span>Due: {formatDate(task.task.due_date)}</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded">
              {task.task.owner_type}
            </span>
            {task.task.is_internal && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Internal</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Create New Task</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Owner Type
                </label>
                <select
                  value={newTask.owner_type}
                  onChange={(e) => setNewTask({ ...newTask, owner_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="agent">Agent</option>
                  <option value="client">Client</option>
                  <option value="lender">Lender</option>
                  <option value="escrow">Escrow</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_internal"
                checked={newTask.is_internal}
                onChange={(e) => setNewTask({ ...newTask, is_internal: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_internal" className="text-sm text-text-secondary">
                Internal only
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium text-text-secondary hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Task Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark"
        >
          <Plus className="w-5 h-5" />
          Create Task
        </button>
      )}

      {/* Overdue Tasks */}
      {tasks.overdue.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-red-600">
            Overdue ({tasks.overdue.length})
          </h3>
          <div className="space-y-3">
            {tasks.overdue.map((task) => (
              <TaskItem key={task.task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Due This Week */}
      {tasks.dueThisWeek.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-orange-600">
            Due This Week ({tasks.dueThisWeek.length})
          </h3>
          <div className="space-y-3">
            {tasks.dueThisWeek.map((task) => (
              <TaskItem key={task.task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Later */}
      {tasks.later.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-text-secondary">
            Later ({tasks.later.length})
          </h3>
          <div className="space-y-3">
            {tasks.later.map((task) => (
              <TaskItem key={task.task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.overdue.length === 0 && tasks.dueThisWeek.length === 0 && tasks.later.length === 0 && (
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-12 text-center">
          <p className="text-text-secondary">No tasks found</p>
        </div>
      )}
    </div>
  )
}

