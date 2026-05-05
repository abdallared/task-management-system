/**
 * Filter tasks based on search query and filter criteria
 * @param {Array} tasks - Array of task objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered tasks
 */
export const filterTasks = (tasks, filters) => {
  if (!tasks || tasks.length === 0) return []

  let filtered = [...tasks]

  // Search filter (title and description)
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase().trim()
    filtered = filtered.filter(task => {
      const titleMatch = task.title?.toLowerCase().includes(searchLower)
      const descMatch = task.description?.toLowerCase().includes(searchLower)
      return titleMatch || descMatch
    })
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(task => task.status === filters.status)
  }

  // Priority filter
  if (filters.priority) {
    filtered = filtered.filter(task => task.priority === filters.priority)
  }

  // Assignee filter
  if (filters.assignee) {
    filtered = filtered.filter(task => {
      if (!task.task_assignments || task.task_assignments.length === 0) {
        return false
      }
      return task.task_assignments.some(
        assignment => assignment.user_id === filters.assignee
      )
    })
  }

  // Label filter
  if (filters.label) {
    filtered = filtered.filter(task => {
      if (!task.task_labels || task.task_labels.length === 0) {
        return false
      }
      return task.task_labels.some(
        taskLabel => taskLabel.label?.id === filters.label
      )
    })
  }

  return filtered
}

/**
 * Get filter statistics
 * @param {Array} tasks - Array of task objects
 * @param {Array} allTasks - All tasks before filtering
 * @returns {Object} Statistics
 */
export const getFilterStats = (tasks, allTasks) => {
  return {
    showing: tasks.length,
    total: allTasks.length,
    filtered: allTasks.length - tasks.length
  }
}
