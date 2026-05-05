import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export const useKeyboardShortcuts = (handlers = {}) => {
  const navigate = useNavigate()

  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
    if (isInputField && !event.metaKey && !event.ctrlKey) {
      return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    // Build shortcut key
    let shortcut = ''
    if (ctrl) shortcut += 'ctrl+'
    if (shift) shortcut += 'shift+'
    if (alt) shortcut += 'alt+'
    shortcut += key

    // Check if handler exists for this shortcut
    if (handlers[shortcut]) {
      event.preventDefault()
      handlers[shortcut](event)
      return
    }

    // Global shortcuts (always available)
    switch (shortcut) {
      case 'ctrl+k':
      case 'ctrl+/':
        event.preventDefault()
        handlers.openSearch?.()
        break
      case '?':
        if (!isInputField) {
          event.preventDefault()
          handlers.openHelp?.()
        }
        break
      case 'escape':
        event.preventDefault()
        handlers.closeModal?.()
        break
      default:
        break
    }
  }, [handlers])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])
}

// Predefined shortcut sets
export const SHORTCUTS = {
  // Global
  OPEN_SEARCH: 'ctrl+k',
  OPEN_HELP: '?',
  CLOSE_MODAL: 'escape',
  
  // Navigation
  GO_TO_DASHBOARD: 'g d',
  GO_TO_CALENDAR: 'g c',
  GO_TO_ANALYTICS: 'g a',
  
  // Task actions
  CREATE_TASK: 'c',
  EDIT_TASK: 'e',
  DELETE_TASK: 'delete',
  MARK_DONE: 'd',
  
  // View
  TOGGLE_VIEW: 'v',
  FOCUS_SEARCH: '/',
  
  // Other
  REFRESH: 'r',
  SAVE: 'ctrl+s'
}
