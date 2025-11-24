'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Calendar, Check, Clock } from 'lucide-react'

interface Task {
  id: string
  deal_id: string
  title: string
  due_date: string | null
  property_address: string
}

interface NextActionsCardProps {
  upcomingTasks: Task[]
  overdueTasks: Task[]
}

export function NextActionsCard({ upcomingTasks, overdueTasks }: NextActionsCardProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const allTasks = [...overdueTasks, ...upcomingTasks]

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-text-secondary" />
          Next Actions
        </h3>
        <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2.5 py-1 rounded-full">
          {allTasks.length}
        </span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
        {allTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-text-secondary text-sm font-medium">No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-6">
            {overdueTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Overdue
                </h4>
                <div className="space-y-2">
                  {overdueTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      isOverdue={true} 
                      isCompleted={completedTasks.has(task.id)}
                      onToggle={() => toggleTask(task.id)}
                      daysLeft={getDaysUntilDue(task.due_date)}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming
                </h4>
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 6).map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      isOverdue={false}
                      isCompleted={completedTasks.has(task.id)}
                      onToggle={() => toggleTask(task.id)}
                      daysLeft={getDaysUntilDue(task.due_date)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskItem({ 
  task, 
  isOverdue, 
  isCompleted, 
  onToggle, 
  daysLeft 
}: { 
  task: Task, 
  isOverdue: boolean, 
  isCompleted: boolean, 
  onToggle: () => void,
  daysLeft: number | null
}) {
  return (
    <div className={`group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
      isCompleted 
        ? 'bg-gray-50 border-transparent opacity-60' 
        : isOverdue
          ? 'bg-red-50/30 border-red-100 hover:border-red-200'
          : 'bg-white border-border hover:border-accent/50'
    }`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center ${
          isCompleted
            ? 'bg-accent border-accent text-white'
            : isOverdue
              ? 'border-red-300 hover:border-red-400 bg-white'
              : 'border-gray-300 hover:border-accent bg-white'
        }`}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium mb-1 ${
          isCompleted ? 'text-gray-500 line-through' : 'text-text-primary'
        }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="truncate max-w-[150px]">{task.property_address}</span>
          {task.due_date && (
            <>
              <span>•</span>
              <span className={`flex items-center gap-1 ${
                !isCompleted && isOverdue ? 'text-red-600 font-medium' : ''
              }`}>
                <Clock className="w-3 h-3" />
                {daysLeft !== null && daysLeft < 0 
                  ? `${Math.abs(daysLeft)}d overdue` 
                  : daysLeft === 0 ? 'Due today'
                  : `${daysLeft}d left`}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
