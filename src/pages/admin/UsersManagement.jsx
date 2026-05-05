import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Shield,
  Search,
  Edit,
  Trash2,
  Crown,
  User,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Settings,
} from 'lucide-react'
import {
  getAllUsers,
  updateUserSystemRole,
  updateUserProfile,
  getUserDetails,
} from '../../services/api/admin'
import { getSystemRoleDisplay, getRoleDisplay } from '../../hooks/usePermissions'
import CreateUserModal from '../../components/admin/CreateUserModal'
import ChangeGroupRoleModal from '../../components/admin/ChangeGroupRoleModal'

export default function UsersManagement() {
  const { isSystemAdmin, loading: authLoading, user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [expandedUser, setExpandedUser] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedGroupRole, setSelectedGroupRole] = useState(null)

  useEffect(() => {
    if (!authLoading && !isSystemAdmin()) {
      navigate('/')
    }
  }, [isSystemAdmin, authLoading, navigate])

  useEffect(() => {
    if (isSystemAdmin()) {
      loadUsers()
    }
  }, [isSystemAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSystemRole = async (userId, currentRole) => {
    if (userId === currentUser?.id) {
      alert('You cannot change your own system role')
      return
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const confirmMessage = newRole === 'admin'
      ? 'Are you sure you want to make this user a System Administrator? They will have full system access.'
      : 'Are you sure you want to remove System Administrator privileges from this user?'

    if (!confirm(confirmMessage)) return

    try {
      await updateUserSystemRole(userId, newRole)
      await loadUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
    }
  }

  const handleExpandUser = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null)
      setSelectedUser(null)
      return
    }

    try {
      const details = await getUserDetails(userId)
      setSelectedUser(details)
      setExpandedUser(userId)
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase()
    const email = user.user?.email || ''
    const fullName = user.full_name || ''
    return email.toLowerCase().includes(searchLower) || 
           fullName.toLowerCase().includes(searchLower)
  })

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isSystemAdmin()) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Users Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage all system users and their roles
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create User
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  System Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Sign In
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                const roleDisplay = getSystemRoleDisplay(user.system_role)
                const isExpanded = expandedUser === user.id
                const isCurrentUser = user.id === currentUser?.id

                return (
                  <>
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.full_name?.charAt(0) || user.user?.email?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.full_name || 'No name'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            user.system_role === 'admin'
                              ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{roleDisplay.icon}</span>
                          <span>{roleDisplay.name}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.user?.last_sign_in_at
                          ? new Date(user.user.last_sign_in_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleExpandUser(user.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="View details"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleSystemRole(user.id, user.system_role)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.system_role === 'admin'
                                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              title={user.system_role === 'admin' ? 'Remove admin' : 'Make admin'}
                            >
                              {user.system_role === 'admin' ? (
                                <Shield className="w-5 h-5" />
                              ) : (
                                <Crown className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && selectedUser && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              User Groups
                            </h4>
                            {selectedUser.groups && selectedUser.groups.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedUser.groups.map((membership) => (
                                  <div
                                    key={membership.group.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                          {membership.group.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Joined {new Date(membership.joined_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                        {membership.role}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedGroupRole({
                                          user: {
                                            id: selectedUser.id,
                                            email: selectedUser.user?.email,
                                            full_name: selectedUser.full_name
                                          },
                                          group: membership.group,
                                          currentRole: membership.role
                                        })
                                        setShowRoleModal(true)
                                      }}
                                      className="w-full mt-2 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Settings className="w-3 h-3" />
                                      Change Role
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Not a member of any groups
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>{filteredUsers.length}</strong> users found
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadUsers()
            alert('User created successfully!')
          }}
        />
      )}

      {showRoleModal && selectedGroupRole && (
        <ChangeGroupRoleModal
          user={selectedGroupRole.user}
          group={selectedGroupRole.group}
          currentRole={selectedGroupRole.currentRole}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedGroupRole(null)
          }}
          onSuccess={() => {
            handleExpandUser(selectedGroupRole.user.id)
            alert('Role updated successfully!')
          }}
        />
      )}
    </div>
  )
}
