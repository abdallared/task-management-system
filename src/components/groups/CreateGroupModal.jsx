import { useState } from 'react'
import { X } from 'lucide-react'
import { useGroups } from '../../hooks/useGroups'

export default function CreateGroupModal({ onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { createGroup, isCreating } = useGroups()

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Group name is required')
      return
    }
    
    createGroup(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          console.log('Group created successfully')
          onClose()
        },
        onError: (error) => {
          console.error('Error creating group:', error)
          alert(`Failed to create group: ${error.message}`)
        }
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Group
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="My Team"
              maxLength={100}
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
              placeholder="What is this group for?"
              rows={3}
              maxLength={500}
            />
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
              {isCreating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
