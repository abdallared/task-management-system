import { Link } from 'react-router-dom'

// Parse comment text and highlight mentions
export default function CommentText({ text, members = [] }) {
  // Regular expression to match @mentions
  const mentionRegex = /@(\S+(?:\s+\S+)*?)(?=\s|$|[.,!?;:])/g
  
  const parts = []
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      })
    }

    // Add mention
    const mentionName = match[1]
    const member = members.find(m => 
      (m.full_name && m.full_name.toLowerCase() === mentionName.toLowerCase()) ||
      (m.email && m.email.toLowerCase() === mentionName.toLowerCase())
    )

    parts.push({
      type: 'mention',
      content: `@${mentionName}`,
      member: member
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex)
    })
  }

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return (
            <span
              key={index}
              className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-1 rounded font-medium"
              title={part.member?.email || part.content}
            >
              {part.content}
            </span>
          )
        }
        return <span key={index}>{part.content}</span>
      })}
    </span>
  )
}
