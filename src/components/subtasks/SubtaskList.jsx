import { useState } from 'react'
import { Plus, Check, Circle, Trash2, GripVertical } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'

export default function SubtaskList({ parentTask, groupId }) {
  const { tasks, createTask, updateTask, deleteTask } = useTasks(groupId)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Get subtasks for this parent task
  const subtasks = tasks.filter(task => task.parent_task_id === parentTask.id)
  
  // Calculate progress
  const completedCount = subtasks.filter(st => st.status === 'done').length
  const totalCount = subtasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAddSubtask = async (e) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return

    setIsAdding(true)
    try {
      createTask({
        group_id: groupId,
        title: newSubtaskTitle.trim(),
        parent_task_id: parentTask.id,
        status: 'todo',
        priority: parentTask.priority || 'medium'
      }, {
        onSuccess: () => {
          setNewSubtaskTitle('')
        },
        onSettled: () => {
          setIsAdding(false)
        }
      })
    } catch (err) {
      console.error('Error creating subtask:', err)
      setIsAdding(false)
    }
  }

  const toggleSubtaskStatus = (subtask) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done'
    updateTask({
      taskId: subtask.id,
      updates: { status: newStatus }
    })
  }

  const handleDeleteSubtask = (subtaskId) => {
    if (window.confirm('Delete this subtask?')) {
      deleteTask(subtaskId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask List */}
      {subtasks.length > 0 && (
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {/* Drag Handle */}
              <button
                className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Checkbox */}
              <button
                onClick={() => toggleSubtaskStatus(subtask)}
                className="flex-shrink-0"
                title={subtask.status === 'done' ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {subtask.status === 'done' ? (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                )}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-sm ${
                  subtask.status === 'done'
                    ? 'line-through text-gray-500 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {subtask.title}
              </span>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete subtask"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask} className="flex items-center space-x-2">
        <input
          type="text"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a subtask..."
          className="input flex-1 text-sm"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !newSubtaskTitle.trim()}
          className="btn btn-primary btn-sm flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Empty State */}
      {subtasks.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No subtasks yet. Add one above to break down this task.
        </p>
      )}
    </div>
  )
}
