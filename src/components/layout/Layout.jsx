import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import OfflineSyncIndicator from '../sync/OfflineSyncIndicator'
import InstallPrompt from '../pwa/InstallPrompt'
import { KeyboardShortcutsHelp } from '../shortcuts/KeyboardShortcutsHelp'
import { CommandPalette } from '../shortcuts/CommandPalette'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

export default function Layout() {
  const [showHelp, setShowHelp] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [sequenceKeys, setSequenceKeys] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { groupId } = useParams()

  // Handle sequential shortcuts (like "g d" for go to dashboard)
  useEffect(() => {
    if (sequenceKeys.length === 0) return

    const timeout = setTimeout(() => {
      setSequenceKeys([])
    }, 1000) // Reset after 1 second

    // Check for complete sequences
    const sequence = sequenceKeys.join(' ')
    
    if (sequence === 'g d') {
      navigate('/dashboard')
      setSequenceKeys([])
    } else if (sequence === 'g c' && groupId) {
      navigate(`/groups/${groupId}/calendar`)
      setSequenceKeys([])
    } else if (sequence === 'g a' && groupId) {
      navigate(`/groups/${groupId}/analytics`)
      setSequenceKeys([])
    }

    return () => clearTimeout(timeout)
  }, [sequenceKeys, navigate, groupId])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+k': () => setShowCommandPalette(true),
    '?': () => setShowHelp(true),
    'escape': () => {
      setShowHelp(false)
      setShowCommandPalette(false)
    },
    'g': (e) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        setSequenceKeys(['g'])
      }
    },
    'd': (e) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (sequenceKeys[0] === 'g') {
          // Handled by useEffect
        }
      }
    },
    'c': (e) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (sequenceKeys[0] === 'g') {
          // Handled by useEffect
        } else if (groupId) {
          document.dispatchEvent(new CustomEvent('openCreateTask'))
        }
      }
    },
    'a': (e) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (sequenceKeys[0] === 'g') {
          // Handled by useEffect
        }
      }
    },
    '/': (e) => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        // Focus search if available
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]')
        if (searchInput) {
          searchInput.focus()
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-[57px]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6 lg:ml-64 min-h-[calc(100vh-57px)]">
          <Outlet />
        </main>
      </div>

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />

      {/* Command palette */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />

      {/* Offline sync indicator */}
      <OfflineSyncIndicator />

      {/* PWA Install prompt */}
      <InstallPrompt />

      {/* Keyboard shortcut indicator - hidden on mobile */}
      {sequenceKeys.length > 0 && (
        <div className="hidden sm:block fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-30">
          <div className="flex items-center gap-2">
            <span className="text-sm">Press:</span>
            {sequenceKeys.map((key, i) => (
              <kbd key={i} className="px-2 py-1 text-xs font-semibold bg-gray-700 border border-gray-600 rounded">
                {key}
              </kbd>
            ))}
            <span className="text-sm text-gray-400">...</span>
          </div>
        </div>
      )}
    </div>
  )
}
