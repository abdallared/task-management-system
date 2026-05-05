import { useDroppable } from '@dnd-kit/core'

export const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg transition-colors ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400' : ''
      }`}
    >
      {children}
    </div>
  )
}
