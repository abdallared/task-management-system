import { supabase } from '../supabase'

export const groupsApi = {
  // Get all groups for current user
  getMyGroups: async () => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(
          id,
          role,
          user_id
        )
      `)
      .eq('group_members.user_id', (await supabase.auth.getUser()).data.user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get single group by ID
  getGroup: async (groupId) => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members(
          id,
          role,
          user_id,
          joined_at
        )
      `)
      .eq('id', groupId)
      .single()
    
    if (error) throw error
    return data
  },

  // Create new group
  createGroup: async (groupData) => {
    // Get current user and session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }
    
    if (!user) {
      throw new Error('User not authenticated. Please log in again.')
    }
    
    console.log('Creating group with user:', user.id)
    
    // Add created_by field
    const dataWithUser = {
      ...groupData,
      created_by: user.id
    }
    
    console.log('Group data to insert:', dataWithUser)
    
    const { data, error } = await supabase
      .from('groups')
      .insert([dataWithUser])
      .select()
      .single()
    
    if (error) {
      console.error('Error inserting group:', error)
      throw error
    }
    
    console.log('Group created successfully:', data)
    return data
  },

  // Update group
  updateGroup: async (groupId, updates) => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete group (soft delete)
  deleteGroup: async (groupId) => {
    const { data, error } = await supabase
      .from('groups')
      .update({ archived: true })
      .eq('id', groupId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get group members
  getGroupMembers: async (groupId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
    
    if (error) throw error
    return data
  },

  // Invite member to group
  inviteMember: async (invitationData) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .insert([invitationData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update member role
  updateMemberRole: async (memberId, role) => {
    const { data, error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove member from group
  removeMember: async (memberId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)
    
    if (error) throw error
  }
}
