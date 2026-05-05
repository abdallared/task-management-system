import { Home, Users, Plus, Shield, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useGroups } from '../../hooks/useGroups'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useState, useEffect } from 'react'
import CreateGroupModal from '../groups/CreateGroupModal'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { groups, isLoading } = useGroups()
  const { isSystemAdmin } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
  }, [location.pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:top-[57px] lg:h-[calc(100vh-57px)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 space-y-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between lg:hidden pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                isActive('/dashboard')
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Dashboard</span>
            </Link>

            {/* Admin Link - Only visible to system admins */}
            {isSystemAdmin() && (
              <Link
                to="/admin"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                  isActive('/admin')
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
          </nav>

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Groups
              </h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                aria-label="Create group"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <nav className="space-y-1">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors touch-manipulation ${
                      location.pathname.includes(`/groups/${group.id}`)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium truncate">{group.name}</span>
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </aside>

      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </>
  )
}
