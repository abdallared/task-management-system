import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../services/api/tasks'

export const useTasks = (groupId, filters = {}) => {
  const queryClient = useQueryClient()

  // Get tasks query
  const tasksQuery = useQuery({
    queryKey: ['tasks', groupId, filters],
    queryFn: () => tasksApi.getGroupTasks(groupId, filters),
    enabled: !!groupId
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => tasksApi.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }) => tasksApi.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending
  }
}

export const useTask = (taskId) => {
  const queryClient = useQueryClient()

  // Get single task query
  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getTask(taskId),
    enabled: !!taskId
  })

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (commentData) => tasksApi.addComment(commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    }
  })

  // Add time entry mutation
  const addTimeEntryMutation = useMutation({
    mutationFn: (timeEntryData) => tasksApi.addTimeEntry(timeEntryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    }
  })

  return {
    task: taskQuery.data,
    isLoading: taskQuery.isLoading,
    error: taskQuery.error,
    addComment: addCommentMutation.mutate,
    addTimeEntry: addTimeEntryMutation.mutate
  }
}
