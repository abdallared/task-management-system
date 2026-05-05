import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTask } from '../../hooks/useTasks'
import { useTasks } from '../../hooks/useTasks'
import { ArrowLeft, Calendar, User, Clock, MessageCircle, Edit, Trash2, Link2 } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../services/supabase'
import EditTaskModal from '../../components/tasks/EditTaskModal'
import MentionInput from '../../components/comments/MentionInput'
import CommentText from '../../components/comments/CommentText'
import TaskLabels from '../../components/labels/TaskLabels'
import SubtaskList from '../../components/subtasks/SubtaskList'
import TaskDependencies from '../../components/dependencies/TaskDependencies'
import { TimeTracker } from '../../components/timeTracking/TimeTracker'

const STATUS_OPTIONS = [
  { id: 'todo', label: 'To Do', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'done', label: 'Done', color: 'green' },
  { id: 'blocked', label: 'Blocked', color: 'red' }
]

const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
]

export default function TaskDetailPage() {
  const { groupId, taskId } = useParams()
  const navigate = useNavigate()
  const { task, isLoading, addComment } = useTask(taskId)
  const { updateTask, deleteTask, isDeleting } = useTasks(groupId)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentsWithUsers, setCommentsWithUsers] = useState([])
  const [membersWithEmails, setMembersWithEmails] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch user details for comments
  useEffect(() => {
    const fetchCommentUsers = async () => {
      if (!groupId) return

      try {
        const { data, error } = await supabase
          .rpc('get_group_members_with_emails', { p_group_id: groupId })

        if (!error && data) {
          // Store members for mention autocomplete
          setMembersWithEmails(data)
          
          // Map comments with user info
          if (task?.task_comments && task.task_comments.length > 0) {
            const commentsWithUserInfo = task.task_comments.map(comment => {
              const user = data.find(m => m.user_id === comment.user_id)
              return {
                ...comment,
                user_email: user?.email || 'Unknown',
                user_name: user?.full_name || user?.email || 'Unknown'
              }
            })
            setCommentsWithUsers(commentsWithUserInfo)
          } else {
            setCommentsWithUsers([])
          }
        }
      } catch (err) {
        console.error('Error fetching comment users:', err)
        if (task?.task_comments) {
          setCommentsWithUsers(task.task_comments)
        }
      }
    }

    fetchCommentUsers()
  }, [task?.task_comments, groupId])

  const handleStatusChange = (newStatus) => {
    updateTask({
      taskId,
      updates: { status: newStatus }
    })
  }

  const handlePriorityChange = (newPriority) => {
    updateTask({
      taskId,
      updates: { priority: newPriority }
    })
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const commentData = {
        task_id: taskId,
        user_id: user.id,
        content: commentText.trim()
      }

      addComment(commentData, {
        onSuccess: () => {
          setCommentText('')
        }
      })
    } catch (err) {
      console.error('Error submitting comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = () => {
    deleteTask(taskId, {
      onSuccess: () => {
        navigate(`/groups/${groupId}`)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Task not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {showEditModal && (
        <EditTaskModal
          task={task}
          groupId={groupId}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Delete Task
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete "<strong>{task.title}</strong>"? 
              All comments, assignments, and related data will be permanently removed.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <Link
        to={`/groups/${groupId}`}
        className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to group</span>
      </Link>

      {/* Task header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {task.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm">
              {/* Status Dropdown */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input text-sm py-1 px-2 cursor-pointer"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>

              {/* Priority Dropdown */}
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="input text-sm py-1 px-2 cursor-pointer capitalize"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {task.description && (
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
          </div>
        )}

        {/* Labels */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Labels
          </h3>
          <TaskLabels task={task} groupId={groupId} editable={true} />
        </div>

        {/* Task metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {task.due_date && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Due:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {task.task_assignments?.length > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {task.task_assignments.length} {task.task_assignments.length === 1 ? 'person' : 'people'}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {format(new Date(task.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* Subtasks section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Subtasks
        </h2>
        <SubtaskList parentTask={task} groupId={groupId} />
      </div>

      {/* Dependencies section */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Link2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Dependencies
          </h2>
        </div>
        <TaskDependencies task={task} groupId={groupId} />
      </div>

      {/* Time Tracking section */}
      <div className="card p-6">
        <TimeTracker taskId={taskId} />
      </div>

      {/* Comments section */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Comments ({task.task_comments?.length || 0})
          </h2>
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <MentionInput
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onSubmit={handleSubmitComment}
            members={membersWithEmails}
            disabled={isSubmitting}
            placeholder="Add a comment... (use @ to mention someone)"
          />
        </form>

        {/* Comments List */}
        {commentsWithUsers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {commentsWithUsers.map((comment) => (
              <div
                key={comment.id}
                className="border-l-4 border-primary-500 bg-gray-50 dark:bg-gray-900 p-4 rounded-r-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {comment.user_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {comment.user_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <CommentText 
                    text={comment.content} 
                    members={membersWithEmails}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
