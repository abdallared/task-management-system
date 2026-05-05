import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '../services/api/groups'

export const useGroups = () => {
  const queryClient = useQueryClient()

  // Get all groups query
  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups()
  })

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData) => groupsApi.createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    }
  })

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, updates }) => groupsApi.updateGroup(groupId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    }
  })

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId) => groupsApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    }
  })

  return {
    groups: groupsQuery.data || [],
    isLoading: groupsQuery.isLoading,
    error: groupsQuery.error,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending
  }
}

export const useGroup = (groupId) => {
  const queryClient = useQueryClient()

  // Get single group query
  const groupQuery = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getGroup(groupId),
    enabled: !!groupId
  })

  // Get group members query
  const membersQuery = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => groupsApi.getGroupMembers(groupId),
    enabled: !!groupId
  })

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: (invitationData) => groupsApi.inviteMember(invitationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
    }
  })

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, role }) => groupsApi.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
    }
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => groupsApi.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
    }
  })

  return {
    group: groupQuery.data,
    members: membersQuery.data || [],
    isLoading: groupQuery.isLoading || membersQuery.isLoading,
    error: groupQuery.error || membersQuery.error,
    inviteMember: inviteMemberMutation.mutate,
    updateMemberRole: updateMemberRoleMutation.mutate,
    removeMember: removeMemberMutation.mutate
  }
}
