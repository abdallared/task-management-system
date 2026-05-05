import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { getAllGroups, deleteGroup } from '../../services/api/admin'

export default function GroupsManagement() {
  const { isSystemAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !isSystemAdmin()) {
      navigate('/')
    }
  }, [isSystemAdmin, authLoading, navigate])

  useEffect(() => {
    if (isSystemAdmin()) {
      loadGroups()
    }
  }, [isSystemAdmin])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await getAllGroups()
      setGroups(data)
    } catch (error) {
      console.error('Error loading groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId, groupName) => {
    const confirmMessage = `Are you sure you want to delete the group "${groupName}"? This will delete all tasks, comments, and data associated with this group. This action cannot be undone.`
    
    if (!confirm(confirmMessage)) return

    try {
      await deleteGroup(groupId)
      await loadGroups()
      alert('Group deleted successfully')
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Failed to delete group')
    }
  }

  const filteredGroups = groups.filter(group => {
    const searchLower = searchQuery.toLowerCase()
    const name = group.name || ''
    const description = group.description || ''
    return name.toLowerCase().includes(searchLower) || 
           description.toLowerCase().includes(searchLower)
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
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Groups Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage all groups in the system
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            {/* Group Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>
              {group.archived && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                  Archived
                </span>
              )}
            </div>

            {/* Group Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{group.members?.[0]?.count || 0} members</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
              </div>
              {group.creator?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>By {group.creator.email}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigate(`/groups/${group.id}`)}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => handleDeleteGroup(group.id, group.name)}
                className="flex-1 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No groups found matching your search' : 'No groups in the system'}
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <strong>{filteredGroups.length}</strong> groups found
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      </div>
    </div>
  )
}
