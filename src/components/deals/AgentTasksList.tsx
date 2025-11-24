'use client'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
}

interface AgentTasksListProps {
  tasks: Task[]
}

export function AgentTasksList({ tasks }: AgentTasksListProps) {
  const activeTasks = tasks.filter((t) => !t.completed_at)
  const completedTasks = tasks.filter((t) => t.completed_at)

  return (
    <div className="bg-white rounded-xl border border-border shadow-soft p-6 mb-6">
      <h2 className="text-lg font-medium text-text-primary mb-4">Agent Tasks</h2>
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <p className="text-text-secondary text-sm">No tasks</p>
      ) : (
        <div className="space-y-4">
          {activeTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Active</h3>
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:shadow-soft transition-shadow"
                  >
                    <input type="checkbox" className="mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-text-secondary mt-1">{task.description}</p>
                      )}
                      {task.due_date && (
                        <p className="text-xs text-text-secondary mt-1">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Completed</h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border opacity-60"
                  >
                    <input type="checkbox" checked readOnly className="mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary line-through">
                        {task.title}
                      </p>
                      {task.completed_at && (
                        <p className="text-xs text-text-secondary mt-1">
                          Completed: {new Date(task.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

