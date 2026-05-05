import { supabase } from '../supabase'

export const tasksApi = {
  // Get all tasks for a group
  getGroupTasks: async (groupId, filters = {}) => {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        task_assignments(
          id,
          user_id,
          assigned_at
        ),
        task_labels(
          id,
          label:labels(*)
        ),
        parent_task:tasks!parent_task_id(
          id,
          title
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.assignedTo) {
      query = query.contains('task_assignments', [{ user_id: filters.assignedTo }])
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Get single task by ID
  getTask: async (taskId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_assignments(
          id,
          user_id,
          assigned_by,
          assigned_at
        ),
        task_labels(
          id,
          label:labels(*)
        ),
        task_comments(
          id,
          content,
          user_id,
          created_at,
          updated_at
        ),
        task_time_entries(
          id,
          user_id,
          start_time,
          end_time,
          duration,
          notes
        ),
        parent_task:tasks!parent_task_id(
          id,
          title
        ),
        subtasks:tasks!parent_task_id(
          id,
          title,
          status,
          priority
        )
      `)
      .eq('id', taskId)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new task
  createTask: async (taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update task
  updateTask: async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete task
  deleteTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    
    if (error) throw error
  },

  // Assign task to users
  assignTask: async (taskId, userIds) => {
    const currentUser = (await supabase.auth.getUser()).data.user
    const assignments = userIds.map(userId => ({
      task_id: taskId,
      user_id: userId,
      assigned_by: currentUser.id
    }))

    const { data, error } = await supabase
      .from('task_assignments')
      .insert(assignments)
      .select()
    
    if (error) throw error
    return data
  },

  // Remove task assignment
  unassignTask: async (assignmentId) => {
    const { error } = await supabase
      .from('task_assignments')
      .delete()
      .eq('id', assignmentId)
    
    if (error) throw error
  },

  // Add comment to task
  addComment: async (commentData) => {
    const { data, error } = await supabase
      .from('task_comments')
      .insert([commentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update comment
  updateComment: async (commentId, content) => {
    const { data, error } = await supabase
      .from('task_comments')
      .update({ content })
      .eq('id', commentId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId)
    
    if (error) throw error
  },

  // Add time entry
  addTimeEntry: async (timeEntryData) => {
    const { data, error } = await supabase
      .from('task_time_entries')
      .insert([timeEntryData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get task dependencies
  getTaskDependencies: async (taskId) => {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select(`
        *,
        depends_on_task:tasks!depends_on_task_id(
          id,
          title,
          status
        )
      `)
      .eq('task_id', taskId)
    
    if (error) throw error
    return data
  },

  // Add task dependency
  addTaskDependency: async (taskId, dependsOnTaskId) => {
    const { data, error } = await supabase
      .from('task_dependencies')
      .insert([{
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
