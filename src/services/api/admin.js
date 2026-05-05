import { supabase } from '../supabase'

/**
 * Admin API Service
 * Handles all admin-related operations
 */

// Get all users with their profiles and groups
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .rpc('get_all_users_with_profiles')

  if (error) throw error

  // Format data to match expected structure
  return data.map(user => ({
    id: user.id,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    system_role: user.system_role,
    created_at: user.profile_created_at,
    user: {
      email: user.email,
      created_at: user.user_created_at,
      last_sign_in_at: user.last_sign_in_at
    }
  }))
}

// Get user details with groups
export const getUserDetails = async (userId) => {
  // Get user email first
  const { data: userEmail, error: emailError } = await supabase
    .rpc('get_user_email', { user_id: userId })
    .single()

  if (emailError) throw emailError

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  // Get user's groups
  const { data: groups, error: groupsError } = await supabase
    .from('group_members')
    .select(`
      role,
      joined_at,
      group:group_id (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', userId)

  if (groupsError) throw groupsError

  return { 
    ...profile, 
    user: userEmail,
    groups: groups.map(g => ({
      ...g,
      group: g.group
    }))
  }
}

// Update user system role
export const updateUserSystemRole = async (userId, systemRole) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ system_role: systemRole })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get admin statistics
export const getAdminStatistics = async () => {
  // Get total users
  const { count: totalUsers, error: usersError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  if (usersError) throw usersError

  // Get active groups
  const { count: activeGroups, error: groupsError } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .eq('archived', false)

  if (groupsError) throw groupsError

  // Get total tasks
  const { count: totalTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })

  if (tasksError) throw tasksError

  // Get completed tasks
  const { count: completedTasks, error: completedError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'done')

  if (completedError) throw completedError

  // Get total comments
  const { count: totalComments, error: commentsError } = await supabase
    .from('task_comments')
    .select('*', { count: 'exact', head: true })

  if (commentsError) throw commentsError

  // Get active members (users in at least one group)
  const { data: activeMembers, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')

  if (membersError) throw membersError

  const uniqueActiveMembers = new Set(activeMembers.map(m => m.user_id)).size

  return {
    totalUsers: totalUsers || 0,
    activeGroups: activeGroups || 0,
    totalTasks: totalTasks || 0,
    completedTasks: completedTasks || 0,
    totalComments: totalComments || 0,
    activeMembers: uniqueActiveMembers
  }
}

// Get all groups with details
export const getAllGroups = async () => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get member counts for each group
  const groupsWithDetails = await Promise.all(
    data.map(async (group) => {
      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)

      // Get creator email
      const { data: creatorData } = await supabase
        .rpc('get_user_email', { user_id: group.created_by })
        .single()

      return {
        ...group,
        members: [{ count: count || 0 }],
        creator: creatorData || null
      }
    })
  )

  return groupsWithDetails
}

// Update user role in group
export const updateUserGroupRole = async (groupId, userId, role) => {
  const { data, error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Remove user from group
export const removeUserFromGroup = async (groupId, userId) => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// Delete group (admin only)
export const deleteGroup = async (groupId) => {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}

// Get recent activity (admin view)
export const getRecentActivity = async (limit = 50) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      user:user_id (
        email
      ),
      group:groups (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
