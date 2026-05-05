import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { DraggableCalendarView } from '../../components/calendar/DraggableCalendarView'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function CalendarPage() {
  const { groupId } = useParams()
  const { tasks, isLoading } = useTasks(groupId)

  // Filter to only show tasks with due dates
  const tasksWithDueDates = tasks?.filter(task => task.due_date) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-600">
              {tasksWithDueDates.length} {tasksWithDueDates.length === 1 ? 'task' : 'tasks'} with due dates
            </p>
          </div>
        </div>
      </div>

      {/* Calendar view */}
      {tasksWithDueDates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks with due dates</h3>
          <p className="text-gray-600">
            Add due dates to your tasks to see them on the calendar
          </p>
        </div>
      ) : (
        <DraggableCalendarView tasks={tasksWithDueDates} groupId={groupId} />
      )}
    </div>
  )
}
