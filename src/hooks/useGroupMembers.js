import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

/**
 * Hook to fetch and manage group members
 * @param {string} groupId - The group ID to fetch members for
 * @returns {object} Members data and loading state
 */
export const useGroupMembers = (groupId) => {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!groupId) {
      setIsLoading(false)
      return
    }

    fetchMembers()

    // Subscribe to changes
    const subscription = supabase
      .channel(`group_members:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMembers()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [groupId])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:user_id (
            id,
            email
          ),
          profile:user_profiles!user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (fetchError) throw fetchError

      // Flatten the data structure
      const formattedMembers = data.map(member => ({
        ...member,
        email: member.user?.email,
        full_name: member.profile?.full_name || member.user?.email,
        avatar_url: member.profile?.avatar_url,
      }))

      setMembers(formattedMembers)
    } catch (err) {
      console.error('Error fetching group members:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addMember = async (userId, role = 'member') => {
    try {
      const { data, error: addError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
        })
        .select()
        .single()

      if (addError) throw addError

      await fetchMembers()
      return data
    } catch (err) {
      console.error('Error adding member:', err)
      throw err
    }
  }

  const updateMemberRole = async (userId, newRole) => {
    try {
      const { data, error: updateError } = await supabase
        .from('group_members')
        .update({ role: newRole })
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      await fetchMembers()
      return data
    } catch (err) {
      console.error('Error updating member role:', err)
      throw err
    }
  }

  const removeMember = async (userId) => {
    try {
      const { error: removeError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (removeError) throw removeError

      await fetchMembers()
    } catch (err) {
      console.error('Error removing member:', err)
      throw err
    }
  }

  return {
    members,
    isLoading,
    error,
    addMember,
    updateMemberRole,
    removeMember,
    refetch: fetchMembers,
  }
}
