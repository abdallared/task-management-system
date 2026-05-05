import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { useGroup } from '../../hooks/useGroups'
import { useTasks } from '../../hooks/useTasks'
import { useRealtime } from '../../hooks/useRealtime'
import { Plus, LayoutGrid, List, Users, Tag, Calendar, BarChart3 } from 'lucide-react'
import TaskBoard from '../../components/tasks/TaskBoard'
import TaskList from '../../components/tasks/TaskList'
import CreateTaskModal from '../../components/tasks/CreateTaskModal'
import GroupMembersModal from '../../components/groups/GroupMembersModal'
import ManageLabelsModal from '../../components/labels/ManageLabelsModal'
import SearchAndFilters from '../../components/filters/SearchAndFilters'
import { filterTasks, getFilterStats } from '../../utils/filterTasks'
import { supabase } from '../../services/supabase'

export default function GroupPage() {
  const { groupId } = useParams()
  const { group, isLoading: groupLoading } = useGroup(groupId)
  const { tasks, isLoading: tasksLoading } = useTasks(groupId)
  const [view, setView] = useState('board') // 'board' or 'list'
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [filters, setFilters] = useState({})
  const [membersWithEmails, setMembersWithEmails] = useState([])

  // Enable real-time updates
  useRealtime(groupId)

  // Listen for keyboard shortcut events
  useEffect(() => {
    const handleOpenCreateTask = () => setShowCreateTask(true)
    const handleOpenMembers = () => setShowMembers(true)
    const handleOpenLabels = () => setShowLabels(true)

    document.addEventListener('openCreateTask', handleOpenCreateTask)
    document.addEventListener('openMembers', handleOpenMembers)
    document.addEventListener('openLabels', handleOpenLabels)

    return () => {
      document.removeEventListener('openCreateTask', handleOpenCreateTask)
      document.removeEventListener('openMembers', handleOpenMembers)
      document.removeEventListener('openLabels', handleOpenLabels)
    }
  }, [])

  // Fetch group members for filter
  useEffect(() => {
    const fetchMembers = async () => {
      if (!groupId) return
      
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

    fetchMembers()
  }, [groupId])

  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, filters)
  }, [tasks, filters])

  // Get filter statistics
  const stats = useMemo(() => {
    return getFilterStats(filteredTasks, tasks)
  }, [filteredTasks, tasks])

  if (groupLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Group not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {group.description}
            </p>
          )}
        </div>

        {/* Action buttons - Mobile optimized */}
        <div className="flex flex-wrap gap-2">
          {/* Analytics button */}
          <Link
            to={`/groups/${groupId}/analytics`}
            className="btn btn-secondary flex items-center space-x-2 text-sm touch-manipulation"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>

          {/* Calendar button */}
          <Link
            to={`/groups/${groupId}/calendar`}
            className="btn btn-secondary flex items-center space-x-2 text-sm touch-manipulation"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Calendar</span>
          </Link>

          {/* Members button */}
          <button
            onClick={() => setShowMembers(true)}
            className="btn btn-secondary flex items-center space-x-2 text-sm touch-manipulation"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Members</span>
          </button>

          {/* Labels button */}
          <button
            onClick={() => setShowLabels(true)}
            className="btn btn-secondary flex items-center space-x-2 text-sm touch-manipulation"
          >
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Labels</span>
          </button>

          {/* View toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setView('board')}
              className={`p-2 rounded transition-colors touch-manipulation ${
                view === 'board'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label="Board view"
            >
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded transition-colors touch-manipulation ${
                view === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Create task button - Full width on mobile */}
          <button
            onClick={() => setShowCreateTask(true)}
            className="btn btn-primary flex items-center justify-center space-x-2 text-sm touch-manipulation flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        groupId={groupId}
        members={membersWithEmails}
        onFiltersChange={setFilters}
      />

      {/* Filter Statistics */}
      {stats.filtered > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {stats.showing} of {stats.total} tasks
          {stats.filtered > 0 && ` (${stats.filtered} filtered out)`}
        </div>
      )}

      {/* Tasks view */}
      {view === 'board' ? (
        <TaskBoard tasks={filteredTasks} groupId={groupId} />
      ) : (
        <TaskList tasks={filteredTasks} groupId={groupId} />
      )}

      {/* Create task modal */}
      {showCreateTask && (
        <CreateTaskModal
          groupId={groupId}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {/* Group members modal */}
      {showMembers && (
        <GroupMembersModal
          groupId={groupId}
          onClose={() => setShowMembers(false)}
        />
      )}

      {/* Manage labels modal */}
      {showLabels && (
        <ManageLabelsModal
          groupId={groupId}
          onClose={() => setShowLabels(false)}
        />
      )}
    </div>
  )
}
