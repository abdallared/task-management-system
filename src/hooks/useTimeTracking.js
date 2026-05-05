import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timeTrackingApi } from '../services/api/timeTracking'
import { supabase } from '../services/supabase'
import { useEffect } from 'react'

export const useTimeTracking = (taskId) => {
  const queryClient = useQueryClient()
  const currentUser = supabase.auth.getUser().then(res => res.data.user)

  // Get all time entries for task
  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntries', taskId],
    queryFn: () => timeTrackingApi.getTaskTimeEntries(taskId),
    enabled: !!taskId
  })

  // Get active timer for current user
  const { data: activeTimer } = useQuery({
    queryKey: ['activeTimer', taskId],
    queryFn: async () => {
      const user = await currentUser
      return timeTrackingApi.getActiveTimeEntry(taskId, user.id)
    },
    enabled: !!taskId,
    refetchInterval: 1000 // Refresh every second to update timer display
  })

  // Get total time
  const { data: totalTime = 0 } = useQuery({
    queryKey: ['totalTime', taskId],
    queryFn: () => timeTrackingApi.getTotalTime(taskId),
    enabled: !!taskId
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const user = await currentUser
      return timeTrackingApi.startTimer(taskId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['activeTimer', taskId])
      queryClient.invalidateQueries(['timeEntries', taskId])
    }
  })

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: ({ entryId, notes }) => timeTrackingApi.stopTimer(entryId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeTimer', taskId])
      queryClient.invalidateQueries(['timeEntries', taskId])
      queryClient.invalidateQueries(['totalTime', taskId])
    }
  })

  // Add manual entry mutation
  const addManualEntryMutation = useMutation({
    mutationFn: async ({ startTime, endTime, notes }) => {
      const user = await currentUser
      return timeTrackingApi.addManualEntry(taskId, user.id, startTime, endTime, notes)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries', taskId])
      queryClient.invalidateQueries(['totalTime', taskId])
    }
  })

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: (entryId) => timeTrackingApi.deleteTimeEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['timeEntries', taskId])
      queryClient.invalidateQueries(['totalTime', taskId])
    }
  })

  // Real-time subscription
  useEffect(() => {
    if (!taskId) return

    const channel = supabase
      .channel(`time_entries:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_time_entries',
          filter: `task_id=eq.${taskId}`
        },
        () => {
          queryClient.invalidateQueries(['timeEntries', taskId])
          queryClient.invalidateQueries(['activeTimer', taskId])
          queryClient.invalidateQueries(['totalTime', taskId])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, queryClient])

  return {
    timeEntries,
    activeTimer,
    totalTime,
    isLoading,
    startTimer: startTimerMutation.mutate,
    stopTimer: stopTimerMutation.mutate,
    addManualEntry: addManualEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    isStarting: startTimerMutation.isPending,
    isStopping: stopTimerMutation.isPending
  }
}
