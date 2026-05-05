import { useParams } from 'react-router-dom'
import { useAnalytics } from '../../hooks/useAnalytics'
import { StatCard } from '../../components/analytics/StatCard'
import { ProgressBar } from '../../components/analytics/ProgressBar'
import { PieChart } from '../../components/analytics/PieChart'
import { BarChart } from '../../components/analytics/BarChart'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Users,
  Target,
  Activity,
  BarChart3
} from 'lucide-react'
import { formatDuration } from '../../utils/dateUtils'

export default function AnalyticsPage() {
  const { groupId } = useParams()
  const { analytics, userPerformance, completionTrend, activitySummary, isLoading } = useAnalytics(groupId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load analytics</p>
      </div>
    )
  }

  // Prepare data for charts
  const statusData = [
    { label: 'To Do', value: analytics.todoTasks, color: '#9ca3af' },
    { label: 'In Progress', value: analytics.inProgressTasks, color: '#3b82f6' },
    { label: 'Done', value: analytics.completedTasks, color: '#10b981' },
    { label: 'Blocked', value: analytics.blockedTasks, color: '#ef4444' }
  ]

  const priorityData = [
    { label: 'Urgent', value: analytics.urgentTasks, color: '#ef4444' },
    { label: 'High', value: analytics.highTasks, color: '#f97316' },
    { label: 'Medium', value: analytics.mediumTasks, color: '#eab308' },
    { label: 'Low', value: analytics.lowTasks, color: '#9ca3af' }
  ]

  const userPerformanceData = userPerformance?.slice(0, 10).map(user => ({
    label: user.name,
    value: user.completed
  })) || []

  const completionTrendData = completionTrend?.map(item => ({
    label: item.date,
    value: item.count
  })) || []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Performance metrics and insights for your team
            </p>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={analytics.totalTasks}
          subtitle={`${analytics.completionRate}% completed`}
          icon={Target}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={analytics.completedTasks}
          subtitle={`${analytics.completedThisWeek} this week`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={analytics.inProgressTasks}
          subtitle={`${analytics.blockedTasks} blocked`}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Team Members"
          value={analytics.teamSize}
          subtitle={`${analytics.tasksWithComments} tasks with comments`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.overdueTasks}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue Tasks</p>
            </div>
          </div>
          {analytics.overdueTasks > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Requires immediate attention
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(analytics.avgTimePerTask)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time per Task</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total: {formatDuration(analytics.totalTime)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.completedThisMonth}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed This Month</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {analytics.completedThisWeek} this week
          </p>
        </div>
      </div>

      {/* Progress bars */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Task Progress</h3>
        <div className="space-y-6">
          <ProgressBar
            label="Overall Completion"
            value={analytics.completedTasks}
            max={analytics.totalTasks}
            color="green"
          />
          <ProgressBar
            label="In Progress"
            value={analytics.inProgressTasks}
            max={analytics.totalTasks}
            color="blue"
          />
          <ProgressBar
            label="Blocked Tasks"
            value={analytics.blockedTasks}
            max={analytics.totalTasks}
            color="red"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          title="Tasks by Status"
          data={statusData}
        />
        <PieChart
          title="Tasks by Priority"
          data={priorityData}
        />
      </div>

      {/* Completion trend */}
      {completionTrendData.length > 0 && (
        <BarChart
          title="Task Completion Trend (Last 7 Days)"
          data={completionTrendData}
          color="#10b981"
        />
      )}

      {/* User performance */}
      {userPerformanceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Top Performers (by completed tasks)
          </h3>
          <div className="space-y-4">
            {userPerformance?.slice(0, 10).map((user, index) => (
              <div key={user.userId} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {user.completed} / {user.totalAssigned} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${user.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                      {user.completionRate}%
                    </span>
                  </div>
                  {user.totalTime > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Time tracked: {formatDuration(user.totalTime)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity summary */}
      {activitySummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity (Last 7 Days)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activitySummary.taskCreated}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Created</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activitySummary.taskUpdated}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Updated</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activitySummary.taskCompleted}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activitySummary.commentAdded}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Comments Added</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
