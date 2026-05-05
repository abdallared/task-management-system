import { useState } from 'react'
import { X, Shield, Users as UsersIcon } from 'lucide-react'
import { updateUserGroupRole } from '../../services/api/admin'
import { getRoleDisplay } from '../../hooks/usePermissions'

const AVAILABLE_ROLES = ['owner', 'admin', 'project_manager', 'member', 'viewer']

export default function ChangeGroupRoleModal({ user, group, currentRole, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (selectedRole === currentRole) {
      onClose()
      return
    }

    const confirmMessage = `Are you sure you want to change ${user.full_name || user.email}'s role in "${group.name}" from ${currentRole} to ${selectedRole}?`
    
    if (!confirm(confirmMessage)) return

    setIsLoading(true)
    try {
      await updateUserGroupRole(group.id, user.id, selectedRole)
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err.message || 'Failed to update role')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Change Group Role
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {user.full_name || 'No name'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select New Role
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((role) => {
                const roleInfo = getRoleDisplay(role)
                return (
                  <label
                    key={role}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === role
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {roleInfo.name}
                        </span>
                        {role === currentRole && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {roleInfo.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === currentRole}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
