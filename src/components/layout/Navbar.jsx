import { Moon, Sun, User, LogOut, Keyboard, Menu } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { useAuth } from '../../hooks/useAuth.jsx'
import { useState } from 'react'
import NotificationBell from '../notifications/NotificationBell'

export default function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useThemeStore()
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleShowShortcuts = () => {
    // Trigger keyboard shortcuts help
    const event = new KeyboardEvent('keydown', { key: '?' })
    window.dispatchEvent(event)
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
            TaskFlow
          </h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Keyboard shortcuts - hidden on mobile */}
          <button
            onClick={handleShowShortcuts}
            className="hidden sm:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium truncate max-w-[150px]">
                {user?.email}
              </span>
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop for mobile */}
                <div 
                  className="fixed inset-0 z-40 lg:hidden" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {/* Show email on mobile */}
                  <div className="sm:hidden px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <p className="truncate">{user?.email}</p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      await signOut()
                      setShowUserMenu(false)
                      // Force a full page reload to clear all cached data
                      window.location.href = '/login'
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
