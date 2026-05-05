import { useState, useEffect } from 'react'
import { X, UserPlus, Trash2 } from 'lucide-react'
import { useGroup } from '../../hooks/useGroups'
import { supabase } from '../../services/supabase'

export default function GroupMembersModal({ groupId, onClose }) {
  const { group, removeMember } = useGroup(groupId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const [membersWithEmails, setMembersWithEmails] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState([])

  // Fetch all users for autocomplete
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_all_users_with_profiles')

        if (!error && data) {
          setAllUsers(data)
        }
      } catch (err) {
        console.error('Error fetching users:', err)
      }
    }

    fetchAllUsers()
  }, [])

  // Filter users based on email input
  useEffect(() => {
    if (email.length > 0) {
      const filtered = allUsers.filter(user => {
        const userEmail = user.email?.toLowerCase() || ''
        const userName = user.full_name?.toLowerCase() || ''
        const searchTerm = email.toLowerCase()
        
        // Don't show users who are already members
        const isAlreadyMember = membersWithEmails.some(
          member => member.email === user.email
        )
        
        return !isAlreadyMember && (
          userEmail.includes(searchTerm) || 
          userName.includes(searchTerm)
        )
      }).slice(0, 5) // Limit to 5 suggestions
      
      setFilteredUsers(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredUsers([])
      setShowSuggestions(false)
    }
  }, [email, allUsers, membersWithEmails])

  // Fetch members with emails using the database function
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .rpc('get_group_members_with_emails', { p_group_id: groupId })

        if (error) {
          console.error('Error fetching members:', error)
        } else {
          setMembersWithEmails(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (groupId) {
      fetchMembers()
    }
  }, [groupId])

  const handleSelectUser = (user) => {
    setEmail(user.email)
    setShowSuggestions(false)
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    setIsAdding(true)

    try {
      // Use RPC function to add member by email
      const { data, error: rpcError } = await supabase.rpc('add_member_by_email', {
        p_group_id: groupId,
        p_email: email,
        p_role: role
      })

      if (rpcError) {
        if (rpcError.message.includes('not found')) {
          setError('User not found. They need to register first.')
        } else if (rpcError.message.includes('already')) {
          setError('User is already a member of this group')
        } else {
          setError(rpcError.message)
        }
        setIsAdding(false)
        return
      }

      // Success - refresh members list
      setEmail('')
      setRole('member')
      
      // Refresh the members list
      const { data: refreshedMembers } = await supabase
        .rpc('get_group_members_with_emails', { p_group_id: groupId })
      
      if (refreshedMembers) {
        setMembersWithEmails(refreshedMembers)
      }
      
      alert('Member added successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(memberId)
        
        // Refresh the members list
        const { data: refreshedMembers } = await supabase
          .rpc('get_group_members_with_emails', { p_group_id: groupId })
        
        if (refreshedMembers) {
          setMembersWithEmails(refreshedMembers)
        }
      } catch (err) {
        console.error('Error removing member:', err)
        alert('Failed to remove member')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Group Members
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Member Form */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Add New Member
          </h3>
          <form onSubmit={handleAddMember} className="space-y-3">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => email.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="user@example.com"
                  className="input text-sm w-full"
                  required
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.full_name || user.email}
                        </div>
                        {user.full_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isAdding}
              className="btn btn-primary text-sm flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAdding ? 'Adding...' : 'Add Member'}</span>
            </button>
          </form>
        </div>

        {/* Members List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Current Members ({membersWithEmails?.length || 0})
          </h3>
          
          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
              Loading members...
            </p>
          ) : !membersWithEmails || membersWithEmails.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
              No members yet
            </p>
          ) : (
            <div className="space-y-2">
              {membersWithEmails.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.full_name || member.email}
                    </p>
                    {member.full_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                      {member.role}
                    </p>
                  </div>
                  
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
