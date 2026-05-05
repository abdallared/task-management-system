import { useState, useEffect } from 'react'
import { Search, Filter, X, User, Tag } from 'lucide-react'
import { useLabels } from '../../hooks/useLabels'

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' }
]

const PRIORITY_OPTIONS = [
  { id: 'all', label: 'All Priorities' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
]

export default function SearchAndFilters({ 
  groupId,
  members = [],
  onFiltersChange 
}) {
  const { labels } = useLabels(groupId)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedAssignee, setSelectedAssignee] = useState('all')
  const [selectedLabel, setSelectedLabel] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Update parent component when filters change
  useEffect(() => {
    const filters = {
      search: searchQuery,
      status: selectedStatus !== 'all' ? selectedStatus : null,
      priority: selectedPriority !== 'all' ? selectedPriority : null,
      assignee: selectedAssignee !== 'all' ? selectedAssignee : null,
      label: selectedLabel !== 'all' ? selectedLabel : null
    }
    onFiltersChange(filters)
  }, [searchQuery, selectedStatus, selectedPriority, selectedAssignee, selectedLabel, onFiltersChange])

  const hasActiveFilters = 
    selectedStatus !== 'all' || 
    selectedPriority !== 'all' || 
    selectedAssignee !== 'all' || 
    selectedLabel !== 'all'

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedStatus('all')
    setSelectedPriority('all')
    setSelectedAssignee('all')
    setSelectedLabel('all')
  }

  const activeFilterCount = [
    selectedStatus !== 'all',
    selectedPriority !== 'all',
    selectedAssignee !== 'all',
    selectedLabel !== 'all'
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="input pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn flex items-center space-x-2 relative ${
            hasActiveFilters 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear All Button */}
        {(hasActiveFilters || searchQuery) && (
          <button
            onClick={clearAllFilters}
            className="btn btn-secondary flex items-center space-x-2"
            title="Clear all filters"
          >
            <X className="w-5 h-5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>Assignee</span>
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="input"
            >
              <option value="all">All Assignees</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.full_name || member.email}
                </option>
              ))}
            </select>
          </div>

          {/* Label Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-1">
              <Tag className="w-4 h-4" />
              <span>Label</span>
            </label>
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="input"
            >
              <option value="all">All Labels</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active filters:
          </span>
          
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <span>Status: {STATUS_OPTIONS.find(o => o.id === selectedStatus)?.label}</span>
              <button
                onClick={() => setSelectedStatus('all')}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedPriority !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm">
              <span>Priority: {PRIORITY_OPTIONS.find(o => o.id === selectedPriority)?.label}</span>
              <button
                onClick={() => setSelectedPriority('all')}
                className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedAssignee !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              <span>
                Assignee: {members.find(m => m.user_id === selectedAssignee)?.full_name || 
                          members.find(m => m.user_id === selectedAssignee)?.email}
              </span>
              <button
                onClick={() => setSelectedAssignee('all')}
                className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedLabel !== 'all' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              <span>Label: {labels.find(l => l.id === selectedLabel)?.name}</span>
              <button
                onClick={() => setSelectedLabel('all')}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
