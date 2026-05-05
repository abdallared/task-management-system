import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { notificationsApi } from '../services/api/notifications'
import { supabase } from '../services/supabase'

export const useNotifications = () => {
  const queryClient = useQueryClient()

  // Get current user
  const { data: { user } = {} } = supabase.auth.getUser()

  // Get notifications query
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getUserNotifications(),
    enabled: !!user
  })

  // Get unread count query
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }
  })

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = notificationsApi.subscribeToNotifications(
      user.id,
      (newNotification) => {
        // Add new notification to cache
        queryClient.setQueryData(['notifications'], (old) => {
          return [newNotification, ...(old || [])]
        })
        
        // Update unread count
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
        
        // Optional: Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/favicon.ico'
          })
        }
      }
    )

    return unsubscribe
  }, [user?.id, queryClient])

  return {
    notifications: notificationsQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending
  }
}

// Request browser notification permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}
