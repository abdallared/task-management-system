import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export default function MentionInput({ 
  value, 
  onChange, 
  onSubmit, 
  members = [], 
  disabled = false,
  placeholder = "Add a comment..."
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredMembers, setFilteredMembers] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const textareaRef = useRef(null)

  // Detect @ mentions and show suggestions
  useEffect(() => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const searchTerm = textAfterAt.toLowerCase()
        const filtered = members.filter(member => {
          const name = (member.full_name || member.email || '').toLowerCase()
          const email = (member.email || '').toLowerCase()
          return name.includes(searchTerm) || email.includes(searchTerm)
        })
        
        if (filtered.length > 0) {
          setFilteredMembers(filtered)
          setMentionStart(lastAtIndex)
          setShowSuggestions(true)
          setSelectedIndex(0)
          return
        }
      }
    }
    
    setShowSuggestions(false)
    setMentionStart(-1)
  }, [value, members])

  const insertMention = (member) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeMention = value.substring(0, mentionStart)
    const textAfterCursor = value.substring(cursorPosition)
    const mentionText = `@${member.full_name || member.email}`
    
    const newValue = textBeforeMention + mentionText + ' ' + textAfterCursor
    onChange({ target: { value: newValue } })
    
    setShowSuggestions(false)
    setMentionStart(-1)
    
    // Set cursor position after mention
    setTimeout(() => {
      const newPosition = mentionStart + mentionText.length + 1
      textareaRef.current?.setSelectionRange(newPosition, newPosition)
      textareaRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (filteredMembers[selectedIndex]) {
          insertMention(filteredMembers[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  return (
    <div className="relative">
      <div className="flex space-x-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input flex-1 resize-none"
          rows={3}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="btn btn-primary self-end flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{disabled ? 'Posting...' : 'Post'}</span>
        </button>
      </div>

      {/* Mention Suggestions Dropdown */}
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-10">
          <div className="p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
              Mention someone
            </p>
            {filteredMembers.map((member, index) => (
              <button
                key={member.user_id}
                onClick={() => insertMention(member)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  index === selectedIndex
                    ? 'bg-primary-100 dark:bg-primary-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {(member.full_name || member.email)?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.full_name || member.email}
                    </p>
                    {member.full_name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
