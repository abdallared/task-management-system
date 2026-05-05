import { useState } from 'react'
import { X, Keyboard } from 'lucide-react'

const ShortcutSection = ({ title, shortcuts }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-700">{shortcut.description}</span>
          <div className="flex items-center gap-1">
            {shortcut.keys.map((key, i) => (
              <span key={i}>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
                  {key}
                </kbd>
                {i < shortcut.keys.length - 1 && (
                  <span className="mx-1 text-gray-400">+</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = {
    global: [
      { description: 'Open command palette', keys: [modKey, 'K'] },
      { description: 'Show keyboard shortcuts', keys: ['?'] },
      { description: 'Close modal/dialog', keys: ['Esc'] },
      { description: 'Focus search', keys: ['/'] },
    ],
    navigation: [
      { description: 'Go to dashboard', keys: ['G', 'D'] },
      { description: 'Go to calendar', keys: ['G', 'C'] },
      { description: 'Go to analytics', keys: ['G', 'A'] },
      { description: 'Go back', keys: ['Alt', '←'] },
    ],
    tasks: [
      { description: 'Create new task', keys: ['C'] },
      { description: 'Edit task', keys: ['E'] },
      { description: 'Delete task', keys: ['Delete'] },
      { description: 'Mark as done', keys: ['D'] },
      { description: 'Toggle view (board/list)', keys: ['V'] },
    ],
    editing: [
      { description: 'Save changes', keys: [modKey, 'S'] },
      { description: 'Cancel editing', keys: ['Esc'] },
      { description: 'Bold text', keys: [modKey, 'B'] },
      { description: 'Italic text', keys: [modKey, 'I'] },
    ],
    other: [
      { description: 'Refresh page', keys: ['R'] },
      { description: 'Select all', keys: [modKey, 'A'] },
      { description: 'Copy', keys: [modKey, 'C'] },
      { description: 'Paste', keys: [modKey, 'V'] },
    ]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600">Navigate faster with keyboard shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ShortcutSection title="Global" shortcuts={shortcuts.global} />
              <ShortcutSection title="Navigation" shortcuts={shortcuts.navigation} />
              <ShortcutSection title="Tasks" shortcuts={shortcuts.tasks} />
            </div>
            <div>
              <ShortcutSection title="Editing" shortcuts={shortcuts.editing} />
              <ShortcutSection title="Other" shortcuts={shortcuts.other} />
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Press <kbd className="px-1 py-0.5 text-xs bg-white border border-blue-300 rounded">?</kbd> anytime to see this help</li>
              <li>• Most shortcuts work when not typing in a text field</li>
              <li>• Sequential shortcuts like <kbd className="px-1 py-0.5 text-xs bg-white border border-blue-300 rounded">G</kbd> then <kbd className="px-1 py-0.5 text-xs bg-white border border-blue-300 rounded">D</kbd> should be pressed quickly</li>
              <li>• {isMac ? '⌘ (Command)' : 'Ctrl'} key is used for most shortcuts</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Press <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">Esc</kbd> to close</span>
            <span className="text-xs">Using {isMac ? 'macOS' : 'Windows/Linux'} shortcuts</span>
          </div>
        </div>
      </div>
    </div>
  )
}
