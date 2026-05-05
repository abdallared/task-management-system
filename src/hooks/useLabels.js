import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labelsApi } from '../services/api/labels'

export const useLabels = (groupId) => {
  const queryClient = useQueryClient()

  // Get labels query
  const labelsQuery = useQuery({
    queryKey: ['labels', groupId],
    queryFn: () => labelsApi.getGroupLabels(groupId),
    enabled: !!groupId
  })

  // Create label mutation
  const createLabelMutation = useMutation({
    mutationFn: (labelData) => labelsApi.createLabel(labelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', groupId] })
    }
  })

  // Update label mutation
  const updateLabelMutation = useMutation({
    mutationFn: ({ labelId, updates }) => labelsApi.updateLabel(labelId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', groupId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  // Delete label mutation
  const deleteLabelMutation = useMutation({
    mutationFn: (labelId) => labelsApi.deleteLabel(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', groupId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  // Assign label to task mutation
  const assignLabelMutation = useMutation({
    mutationFn: ({ taskId, labelId }) => labelsApi.assignLabelToTask(taskId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  // Remove label from task mutation
  const removeLabelMutation = useMutation({
    mutationFn: ({ taskId, labelId }) => labelsApi.removeLabelFromTask(taskId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', groupId] })
    }
  })

  return {
    labels: labelsQuery.data || [],
    isLoading: labelsQuery.isLoading,
    error: labelsQuery.error,
    createLabel: createLabelMutation.mutate,
    updateLabel: updateLabelMutation.mutate,
    deleteLabel: deleteLabelMutation.mutate,
    assignLabel: assignLabelMutation.mutate,
    removeLabel: removeLabelMutation.mutate,
    isCreating: createLabelMutation.isPending,
    isUpdating: updateLabelMutation.isPending,
    isDeleting: deleteLabelMutation.isPending
  }
}
