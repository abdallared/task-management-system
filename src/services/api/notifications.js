import { supabase } from '../supabase'

export const notificationsApi = {
  // Get all notifications for current user
  getUserNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    return data
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    
    if (error) throw error
    return count || 0
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    
    if (error) throw error
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    
    if (error) throw error
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
    
    if (error) throw error
  },

  // Create notification (for manual creation)
  createNotification: async (notificationData) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (userId, callback) => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
