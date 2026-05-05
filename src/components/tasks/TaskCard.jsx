import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, MessageCircle, MoreVertical, ArrowRight, Edit, Trash2, CheckSquare } from 'lucide-react'
import { format } from 'date-fns'
import EditTaskModal from './EditTaskModal'

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
}

const STATUS_OPTIONS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' }
]

export default function TaskCard({ task, groupId, onStatusChange, onDelete, isDragging = false }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStatusChange = (newStatus, e) => {
    e.preventDefault()
    e.stopPropagation()
    onStatusChange(task.id, newStatus)
    setShowMenu(false)
  }

  const toggleMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleDeleteClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(task.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      {showEditModal && (
        <EditTaskModal
          task={task}
          groupId={groupId}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete Task
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete "<strong>{task.title}</strong>"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDeleteConfirm(false)
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative">
      <Link
        to={`/groups/${groupId}/tasks/${task.id}`}
        className={`task-card block ${isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-pointer'}`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 pr-2">
            {task.title}
          </h4>
          <div className="flex items-center space-x-1">
            {task.priority && (
              <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority.toUpperCase()}
              </span>
            )}
            <button
              onClick={handleEditClick}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit task"
            >
              <Edit className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={toggleMenu}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Change status"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Labels */}
        {task.task_labels && task.task_labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.task_labels.slice(0, 3).map((taskLabel) => {
              const label = taskLabel.label
              if (!label) return null
              return (
                <span
                  key={taskLabel.id}
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              )
            })}
            {task.task_labels.length > 3 && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                +{task.task_labels.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {task.due_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
            {task.task_assignments?.length > 0 && (
              <div className="flex items-center space-x-1" title={`Assigned to ${task.task_assignments.length} ${task.task_assignments.length === 1 ? 'person' : 'people'}`}>
                <User className="w-3 h-3" />
                <span>{task.task_assignments.length}</span>
              </div>
            )}
            {task.task_comments?.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{task.task_comments.length}</span>
              </div>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="flex items-center space-x-1" title={`${task.subtasks.filter(st => st.status === 'done').length} of ${task.subtasks.length} subtasks completed`}>
                <CheckSquare className="w-3 h-3" />
                <span>{task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Status Change Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Move to
            </div>
            {STATUS_OPTIONS.filter(s => s.id !== task.status).map((status) => (
              <button
                key={status.id}
                onClick={(e) => handleStatusChange(status.id, e)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                <span>{status.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
      </div>
    </>
  )
}
