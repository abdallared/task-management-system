import { useState, useEffect } from 'react'
import { X, UserPlus } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { useGroup } from '../../hooks/useGroups'
import { supabase } from '../../services/supabase'

const STATUSES = ['todo', 'in_progress', 'done', 'blocked']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function CreateTaskModal({ groupId, onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [membersWithEmails, setMembersWithEmails] = useState([])
  
  const { createTask, isCreating } = useTasks(groupId)

  // Fetch group members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_group_members_with_emails', { p_group_id: groupId })

        if (!error && data) {
          setMembersWithEmails(data)
        }
      } catch (err) {
        console.error('Error fetching members:', err)
      }
    }

    if (groupId) {
      fetchMembers()
    }
  }, [groupId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const taskData = {
      group_id: groupId,
      title,
      description,
      status,
      priority,
      due_date: dueDate || null
    }

    createTask(taskData, {
      onSuccess: async (newTask) => {
        // Assign users to the task if any selected
        if (selectedAssignees.length > 0) {
          try {
            // Get current user first
            const { data: { user } } = await supabase.auth.getUser()
            
            // Create assignments array
            const assignments = selectedAssignees.map(userId => ({
              task_id: newTask.id,
              user_id: userId,
              assigned_by: user.id
            }))

            await supabase
              .from('task_assignments')
              .insert(assignments)
          } catch (err) {
            console.error('Error assigning users:', err)
          }
        }
        onClose()
      }
    })
  }

  const toggleAssignee = (userId) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Task title"
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Task description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Assignees Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <UserPlus className="w-4 h-4 inline mr-1" />
              Assign To
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-40 overflow-y-auto">
              {membersWithEmails.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading members...</p>
              ) : (
                <div className="space-y-2">
                  {membersWithEmails.map((member) => (
                    <label
                      key={member.user_id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.user_id)}
                        onChange={() => toggleAssignee(member.user_id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.full_name || member.email}
                        </p>
                        {member.full_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedAssignees.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedAssignees.length} {selectedAssignees.length === 1 ? 'person' : 'people'} selected
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
