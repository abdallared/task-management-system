import { useState, useEffect } from 'react'
import { Link2, Plus, X, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { useTasks } from '../../hooks/useTasks'

export default function TaskDependencies({ task, groupId }) {
  const { tasks } = useTasks(groupId)
  const [dependencies, setDependencies] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch dependencies
  useEffect(() => {
    fetchDependencies()
  }, [task.id])

  // Filter available tasks (exclude self, existing dependencies, and potential circular dependencies)
  useEffect(() => {
    if (!tasks || !dependencies) return

    const dependencyIds = dependencies.map(d => d.depends_on_task_id)
    const blockedIds = getBlockedTaskIds(task.id, dependencies)
    
    const available = tasks.filter(t => 
      t.id !== task.id && // Not self
      !dependencyIds.includes(t.id) && // Not already a dependency
      !blockedIds.includes(t.id) && // Would not create circular dependency
      t.group_id === groupId // Same group
    )
    
    setAvailableTasks(available)
  }, [tasks, dependencies, task.id, groupId])

  const fetchDependencies = async () => {
    try {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select(`
          id,
          depends_on_task_id,
          depends_on_task:tasks!depends_on_task_id(
            id,
            title,
            status,
            priority
          )
        `)
        .eq('task_id', task.id)

      if (error) throw error
      setDependencies(data || [])
    } catch (err) {
      console.error('Error fetching dependencies:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Get all tasks that would be blocked if we add this dependency (to prevent circular)
  const getBlockedTaskIds = (taskId, allDependencies) => {
    const blocked = new Set([taskId])
    const queue = [taskId]

    while (queue.length > 0) {
      const currentId = queue.shift()
      
      // Find all tasks that depend on currentId
      const dependents = allDependencies
        .filter(d => d.depends_on_task_id === currentId)
        .map(d => d.task_id)

      dependents.forEach(depId => {
        if (!blocked.has(depId)) {
          blocked.add(depId)
          queue.push(depId)
        }
      })
    }

    return Array.from(blocked)
  }

  const handleAddDependency = async () => {
    if (!selectedTaskId) return

    setIsAdding(true)
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .insert([{
          task_id: task.id,
          depends_on_task_id: selectedTaskId
        }])

      if (error) throw error

      await fetchDependencies()
      setSelectedTaskId('')
    } catch (err) {
      console.error('Error adding dependency:', err)
      alert('Failed to add dependency. It may create a circular dependency.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveDependency = async (dependencyId) => {
    try {
      const { error } = await supabase
        .from('task_dependencies')
        .delete()
        .eq('id', dependencyId)

      if (error) throw error
      await fetchDependencies()
    } catch (err) {
      console.error('Error removing dependency:', err)
    }
  }

  // Check if task is blocked by incomplete dependencies
  const hasBlockingDependencies = dependencies.some(
    d => d.depends_on_task?.status !== 'done'
  )

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading dependencies...</div>
  }

  return (
    <div className="space-y-4">
      {/* Blocking Warning */}
      {hasBlockingDependencies && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              This task is blocked
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Complete the dependencies below before marking this task as done.
            </p>
          </div>
        </div>
      )}

      {/* Dependencies List */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            This task depends on:
          </p>
          {dependencies.map((dep) => {
            const depTask = dep.depends_on_task
            if (!depTask) return null

            const isComplete = depTask.status === 'done'

            return (
              <div
                key={dep.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isComplete
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isComplete
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {depTask.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: {depTask.status.replace('_', ' ')} • Priority: {depTask.priority}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDependency(dep.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                  title="Remove dependency"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Dependency */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add dependency:
        </p>
        <div className="flex space-x-2">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="input flex-1"
            disabled={isAdding}
          >
            <option value="">Select a task...</option>
            {availableTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.status})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddDependency}
            disabled={isAdding || !selectedTaskId}
            className="btn btn-primary flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        {availableTasks.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            No available tasks to add as dependencies.
          </p>
        )}
      </div>

      {/* Empty State */}
      {dependencies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No dependencies yet. Add tasks that must be completed before this one.
        </p>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Dependencies must be completed before this task can be marked as done</p>
        <p>• Circular dependencies are automatically prevented</p>
      </div>
    </div>
  )
}
