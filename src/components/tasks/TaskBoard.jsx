import { useMemo, useState } from 'react'
import TaskCard from './TaskCard'
import { useTasks } from '../../hooks/useTasks'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DraggableTaskCard } from './DraggableTaskCard'
import { DroppableColumn } from './DroppableColumn'

const STATUSES = [
  { id: 'todo', label: 'To Do', color: 'gray' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'done', label: 'Done', color: 'green' },
  { id: 'blocked', label: 'Blocked', color: 'red' }
]

export default function TaskBoard({ tasks, groupId }) {
  const { updateTask, deleteTask } = useTasks(groupId)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  )

  const tasksByStatus = useMemo(() => {
    const grouped = {}
    STATUSES.forEach(status => {
      grouped[status.id] = tasks.filter(task => task.status === status.id)
    })
    return grouped
  }, [tasks])

  const handleStatusChange = (taskId, newStatus) => {
    updateTask({
      taskId,
      updates: { status: newStatus }
    })
  }

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId)
  }

  const handleDragStart = (event) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const overId = over.id

    // Check if dropped over a column
    const targetStatus = STATUSES.find(s => s.id === overId)
    if (targetStatus) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== targetStatus.id) {
        handleStatusChange(taskId, targetStatus.id)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUSES.map((status) => (
          <DroppableColumn key={status.id} id={status.id}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {status.label}
                </h3>
                <span className={`badge badge-${status.id}`}>
                  {tasksByStatus[status.id].length}
                </span>
              </div>

              <SortableContext
                items={tasksByStatus[status.id].map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 flex-1 min-h-[200px]">
                  {tasksByStatus[status.id].length === 0 ? (
                    <div className="card p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Drop tasks here
                    </div>
                  ) : (
                    tasksByStatus[status.id].map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        groupId={groupId}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          </DroppableColumn>
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 rotate-3 scale-105">
            <TaskCard
              task={activeTask}
              groupId={groupId}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
