import { useMemo } from 'react'
import { useAuth } from './useAuth.jsx'
import { useGroupMembers } from './useGroupMembers'

/**
 * Hook to check user permissions in a group
 * @param {string} groupId - The group ID to check permissions for
 * @returns {object} Permission checks and user role
 */
export const usePermissions = (groupId) => {
  const { user, isSystemAdmin } = useAuth()
  const { members, isLoading } = useGroupMembers(groupId)

  const userMembership = useMemo(() => {
    if (!user || !members) return null
    return members.find(m => m.user_id === user.id)
  }, [user, members])

  const role = userMembership?.role || null

  // Permission checks
  const permissions = useMemo(() => {
    const isAdmin = isSystemAdmin()
    const isOwner = role === 'owner'
    const isGroupAdmin = role === 'admin'
    const isProjectManager = role === 'project_manager'
    const isMember = role === 'member'
    const isViewer = role === 'viewer'

    return {
      // Role checks
      isSystemAdmin: isAdmin,
      isOwner,
      isGroupAdmin,
      isProjectManager,
      isMember,
      isViewer,
      role,

      // Group management permissions
      canUpdateGroup: isAdmin || isOwner || isGroupAdmin,
      canDeleteGroup: isAdmin || isOwner,
      canArchiveGroup: isAdmin || isOwner || isGroupAdmin,
      
      // Member management permissions
      canInviteMembers: isAdmin || isOwner || isGroupAdmin,
      canRemoveMembers: isAdmin || isOwner || isGroupAdmin,
      canUpdateMemberRoles: isAdmin || isOwner || isGroupAdmin,
      
      // Task management permissions
      canCreateTasks: isAdmin || isOwner || isGroupAdmin || isProjectManager || isMember,
      canUpdateTasks: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      canDeleteTasks: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      canAssignTasks: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      canViewTasks: true, // All members can view tasks
      
      // Task interaction permissions
      canCommentOnTasks: isAdmin || isOwner || isGroupAdmin || isProjectManager || isMember,
      canUpdateOwnTasks: true, // Users can update tasks assigned to them
      
      // Label management permissions
      canCreateLabels: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      canUpdateLabels: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      canDeleteLabels: isAdmin || isOwner || isGroupAdmin || isProjectManager,
      
      // Time tracking permissions
      canTrackTime: isAdmin || isOwner || isGroupAdmin || isProjectManager || isMember,
      canViewTimeEntries: true, // All members can view time entries
      
      // Analytics permissions
      canViewAnalytics: true, // All members can view analytics
      canExportData: isAdmin || isOwner || isGroupAdmin,
    }
  }, [role, isSystemAdmin])

  return {
    ...permissions,
    isLoading,
    userMembership,
  }
}

/**
 * Hook to check if user can perform a specific action
 * @param {string} groupId - The group ID
 * @param {string} action - The action to check (e.g., 'canUpdateTasks')
 * @returns {boolean} Whether the user can perform the action
 */
export const useCanPerform = (groupId, action) => {
  const permissions = usePermissions(groupId)
  return permissions[action] || false
}

/**
 * Get role display name and color
 * @param {string} role - The role to get display info for
 * @returns {object} Display name and color
 */
export const getRoleDisplay = (role) => {
  const roleMap = {
    owner: {
      name: 'Owner',
      color: 'purple',
      description: 'Full control over the group',
    },
    admin: {
      name: 'Admin',
      color: 'blue',
      description: 'Can manage members and settings',
    },
    project_manager: {
      name: 'Project Manager',
      color: 'green',
      description: 'Can create, edit, and delete tasks',
    },
    member: {
      name: 'Member',
      color: 'gray',
      description: 'Can create tasks and comment',
    },
    viewer: {
      name: 'Viewer',
      color: 'slate',
      description: 'Can only view tasks',
    },
  }

  return roleMap[role] || { name: role, color: 'gray', description: '' }
}

/**
 * Get system role display name and color
 * @param {string} systemRole - The system role
 * @returns {object} Display name and color
 */
export const getSystemRoleDisplay = (systemRole) => {
  const roleMap = {
    admin: {
      name: 'System Administrator',
      color: 'red',
      description: 'Full system access',
      icon: '👑',
    },
    user: {
      name: 'User',
      color: 'gray',
      description: 'Regular user',
      icon: '👤',
    },
  }

  return roleMap[systemRole] || { name: systemRole, color: 'gray', description: '', icon: '👤' }
}
