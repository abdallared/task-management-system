import { supabase } from '../supabase'

export const labelsApi = {
  // Get all labels for a group
  getGroupLabels: async (groupId) => {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .eq('group_id', groupId)
      .order('name')
    
    if (error) throw error
    return data
  },

  // Create new label
  createLabel: async (labelData) => {
    const { data, error } = await supabase
      .from('labels')
      .insert([labelData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update label
  updateLabel: async (labelId, updates) => {
    const { data, error } = await supabase
      .from('labels')
      .update(updates)
      .eq('id', labelId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete label
  deleteLabel: async (labelId) => {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', labelId)
    
    if (error) throw error
  },

  // Assign label to task
  assignLabelToTask: async (taskId, labelId) => {
    const { data, error } = await supabase
      .from('task_labels')
      .insert([{ task_id: taskId, label_id: labelId }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove label from task
  removeLabelFromTask: async (taskId, labelId) => {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('task_id', taskId)
      .eq('label_id', labelId)
    
    if (error) throw error
  },

  // Get task labels
  getTaskLabels: async (taskId) => {
    const { data, error } = await supabase
      .from('task_labels')
      .select(`
        id,
        label:labels(*)
      `)
      .eq('task_id', taskId)
    
    if (error) throw error
    return data
  }
}
