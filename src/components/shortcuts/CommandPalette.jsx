import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Search, 
  Calendar, 
  BarChart3, 
  Plus, 
  Home,
  Users,
  Tag,
  Clock,
  CheckCircle,
  X
} from 'lucide-react'

export const CommandPalette = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { groupId } = useParams()
  const inputRef = useRef(null)

  const commands = [
    // Navigation
    { 
      id: 'dashboard', 
      label: 'Go to Dashboard', 
      icon: Home, 
      action: () => navigate('/dashboard'),
      category: 'Navigation'
    },
    { 
      id: 'calendar', 
      label: 'Go to Calendar', 
      icon: Calendar, 
      action: () => groupId && navigate(`/groups/${groupId}/calendar`),
      category: 'Navigation',
      disabled: !groupId
    },
    { 
      id: 'analytics', 
      label: 'Go to Analytics', 
      icon: BarChart3, 
      action: () => groupId && navigate(`/groups/${groupId}/analytics`),
      category: 'Navigation',
      disabled: !groupId
    },
    // Actions
    { 
      id: 'create-task', 
      label: 'Create New Task', 
      icon: Plus, 
      action: () => {
        onClose()
        // Trigger create task modal
        document.dispatchEvent(new CustomEvent('openCreateTask'))
      },
      category: 'Actions',
      disabled: !groupId
    },
    { 
      id: 'view-members', 
      label: 'View Team Members', 
      icon: Users, 
      action: () => {
        onClose()
        document.dispatchEvent(new CustomEvent('openMembers'))
      },
      category: 'Actions',
      disabled: !groupId
    },
    { 
      id: 'manage-labels', 
      label: 'Manage Labels', 
      icon: Tag, 
      action: () => {
        onClose()
        document.dispatchEvent(new CustomEvent('openLabels'))
      },
      category: 'Actions',
      disabled: !groupId
    },
  ]

  const filteredCommands = commands.filter(cmd => 
    !cmd.disabled && cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-[20vh] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Commands list */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      command.action()
                      onClose()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === selectedIndex ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        index === selectedIndex ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.category}</div>
                    </div>
                    {index === selectedIndex && (
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded">
                        ↵
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
