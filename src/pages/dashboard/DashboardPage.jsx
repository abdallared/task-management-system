import { useGroups } from '../../hooks/useGroups'
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'

export default function DashboardPage() {
  const { groups, isLoading } = useGroups()
  const [taskStats, setTaskStats] = useState({
    completed: 0,
    inProgress: 0,
    overdue: 0,
    total: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch task statistics across all groups
  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!groups || groups.length === 0) {
        setStatsLoading(false)
        return
      }

      try {
        const groupIds = groups.map(g => g.id)
        
        // Fetch all tasks for user's groups
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('id, status, due_date')
          .in('group_id', groupIds)

        if (error) throw error

        if (tasks) {
          const now = new Date()
          
          const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            overdue: tasks.filter(t => 
              t.due_date && 
              new Date(t.due_date) < now && 
              t.status !== 'done'
            ).length
          }

          setTaskStats(stats)
        }
      } catch (error) {
        console.error('Error fetching task stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchTaskStats()
  }, [groups])

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Groups
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                {groups.length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                {taskStats.completed}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                {taskStats.inProgress}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                {taskStats.overdue}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          Your Groups
        </h2>
        {groups.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              You haven't joined any groups yet.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
              Create a group to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="card p-4 hover:shadow-md transition-shadow touch-manipulation"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{group.group_members?.length || 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
