import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Shield,
  BarChart3,
  Activity,
  FolderKanban,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { getAdminStatistics } from '../../services/api/admin'

export default function AdminDashboard() {
  const { isSystemAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isSystemAdmin()) {
      navigate('/')
    }
  }, [isSystemAdmin, authLoading, navigate])

  useEffect(() => {
    if (isSystemAdmin()) {
      loadStatistics()
    }
  }, [isSystemAdmin])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const data = await getAdminStatistics()
      setStatistics(data)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const stats = [
    {
      name: 'Total Users',
      value: statistics?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      description: 'Registered users',
    },
    {
      name: 'Active Groups',
      value: statistics?.activeGroups || 0,
      icon: FolderKanban,
      color: 'purple',
      description: 'Non-archived groups',
    },
    {
      name: 'Total Tasks',
      value: statistics?.totalTasks || 0,
      icon: CheckCircle,
      color: 'green',
      description: 'All tasks in system',
    },
    {
      name: 'Completed Tasks',
      value: statistics?.completedTasks || 0,
      icon: CheckCircle,
      color: 'emerald',
      description: 'Tasks marked as done',
    },
    {
      name: 'Total Comments',
      value: statistics?.totalComments || 0,
      icon: MessageSquare,
      color: 'orange',
      description: 'Comments on tasks',
    },
    {
      name: 'Active Members',
      value: statistics?.activeMembers || 0,
      icon: Activity,
      color: 'pink',
      description: 'Users in groups',
    },
  ]

  const quickActions = [
    {
      name: 'Manage Users',
      description: 'View and manage all users',
      icon: Users,
      color: 'blue',
      href: '/admin/users',
    },
    {
      name: 'Manage Groups',
      description: 'View and manage all groups',
      icon: FolderKanban,
      color: 'purple',
      href: '/admin/groups',
    },
  ]

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
          <Shield className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            System administration and management
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {stat.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.description}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.name}
                onClick={() => navigate(action.href)}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all hover:scale-105 text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colorClasses[action.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {action.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              System Administrator Access
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You have full system access. You can manage all users, groups, tasks, and system settings.
              Use this power responsibly.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                ✓ Manage Users
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                ✓ Manage Groups
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                ✓ View All Tasks
              </span>
              <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                ✓ System Settings
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
