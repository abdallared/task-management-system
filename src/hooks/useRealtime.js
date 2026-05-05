import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabase'

export const useRealtime = (groupId) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel(`tasks:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          console.log('Task change received:', payload)
          // Invalidate tasks query to refetch
          queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
        }
      )
      .subscribe()

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel(`comments:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments'
        },
        (payload) => {
          console.log('Comment change received:', payload)
          // Invalidate specific task query
          if (payload.new?.task_id) {
            queryClient.invalidateQueries({ queryKey: ['task', payload.new.task_id] })
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(commentsChannel)
    }
  }, [groupId, queryClient])
}
