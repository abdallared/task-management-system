import { supabase } from '../supabase'

export const timeTrackingApi = {
  // Get all time entries for a task
  getTaskTimeEntries: async (taskId) => {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('start_time', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get active time entry for current user and task
  getActiveTimeEntry: async (taskId, userId) => {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .is('end_time', null)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  // Start time tracking
  startTimer: async (taskId, userId) => {
    const { data, error } = await supabase
      .from('task_time_entries')
      .insert([{
        task_id: taskId,
        user_id: userId,
        start_time: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Stop time tracking
  stopTimer: async (entryId, notes = null) => {
    const endTime = new Date().toISOString()
    
    // Get the entry to calculate duration
    const { data: entry, error: fetchError } = await supabase
      .from('task_time_entries')
      .select('start_time')
      .eq('id', entryId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Calculate duration in seconds
    const startTime = new Date(entry.start_time)
    const duration = Math.floor((new Date(endTime) - startTime) / 1000)
    
    const { data, error } = await supabase
      .from('task_time_entries')
      .update({
        end_time: endTime,
        duration,
        notes
      })
      .eq('id', entryId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Add manual time entry
  addManualEntry: async (taskId, userId, startTime, endTime, notes = null) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.floor((end - start) / 1000)
    
    const { data, error } = await supabase
      .from('task_time_entries')
      .insert([{
        task_id: taskId,
        user_id: userId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration,
        notes
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update time entry
  updateTimeEntry: async (entryId, updates) => {
    // If start_time or end_time changed, recalculate duration
    if (updates.start_time || updates.end_time) {
      const { data: entry, error: fetchError } = await supabase
        .from('task_time_entries')
        .select('start_time, end_time')
        .eq('id', entryId)
        .single()
      
      if (fetchError) throw fetchError
      
      const startTime = new Date(updates.start_time || entry.start_time)
      const endTime = new Date(updates.end_time || entry.end_time)
      updates.duration = Math.floor((endTime - startTime) / 1000)
    }
    
    const { data, error } = await supabase
      .from('task_time_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete time entry
  deleteTimeEntry: async (entryId) => {
    const { error } = await supabase
      .from('task_time_entries')
      .delete()
      .eq('id', entryId)
    
    if (error) throw error
  },

  // Get total time for a task
  getTotalTime: async (taskId) => {
    const { data, error } = await supabase
      .from('task_time_entries')
      .select('duration')
      .eq('task_id', taskId)
      .not('duration', 'is', null)
    
    if (error) throw error
    
    const totalSeconds = data.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    return totalSeconds
  },

  // Get time entries for a user
  getUserTimeEntries: async (userId, startDate = null, endDate = null) => {
    let query = supabase
      .from('task_time_entries')
      .select(`
        *,
        task:tasks(
          id,
          title,
          group_id
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
    
    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('start_time', endDate)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  }
}
