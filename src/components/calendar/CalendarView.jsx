import { useState, useMemo } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  done: 'bg-green-100 text-green-700 border-green-300',
  blocked: 'bg-red-100 text-red-700 border-red-300'
}

const PRIORITY_DOTS = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-600'
}

export const CalendarView = ({ tasks = [], groupId }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month', 'week', 'day'

  // Get tasks organized by date
  const tasksByDate = useMemo(() => {
    const organized = {}
    
    tasks.forEach(task => {
      if (!task.due_date) return
      
      const dateKey = format(startOfDay(parseISO(task.due_date)), 'yyyy-MM-dd')
      if (!organized[dateKey]) {
        organized[dateKey] = []
      }
      organized[dateKey].push(task)
    })
    
    // Sort tasks by priority within each date
    Object.keys(organized).forEach(dateKey => {
      organized[dateKey].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    })
    
    return organized
  }, [tasks])

  // Get calendar days for month view
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    return days
  }

  // Get week days
  const getWeekDays = () => {
    const weekStart = startOfWeek(currentDate)
    const days = []
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    
    return days
  }

  // Navigation handlers
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    return tasksByDate[dateKey] || []
  }

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays()
    const weeks = []
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-b border-r border-gray-200 dark:border-gray-700 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                } ${isDayToday ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
                    } ${isDayToday ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <Link
                      key={task.id}
                      to={`/groups/${groupId}/tasks/${task.id}`}
                      className={`block text-xs p-1 rounded border ${
                        STATUS_COLORS[task.status]
                      } hover:shadow-sm transition-shadow truncate`}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority]}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </Link>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays()

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day)
            const isDayToday = isToday(day)

            return (
              <div key={idx} className="bg-white dark:bg-gray-800">
                <div className={`p-3 text-center border-b border-gray-200 dark:border-gray-700 ${isDayToday ? 'bg-blue-50 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{format(day, 'EEE')}</div>
                  <div className={`text-lg font-semibold ${isDayToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[400px]">
                  {dayTasks.map(task => (
                    <Link
                      key={task.id}
                      to={`/groups/${groupId}/tasks/${task.id}`}
                      className={`block p-2 rounded border ${
                        STATUS_COLORS[task.status]
                      } hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[task.priority]}`} />
                        <span className="text-xs font-medium capitalize">{task.priority}</span>
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{task.title}</div>
                      {task.task_assignments?.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {task.task_assignments.length} assigned
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render day view
  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate)
    const isDayToday = isToday(currentDate)

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className={`text-center mb-6 pb-4 border-b ${isDayToday ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{format(currentDate, 'EEEE')}</div>
          <div className={`text-3xl font-bold ${isDayToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
          {isDayToday && (
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Today</div>
          )}
        </div>

        {dayTasks.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No tasks due on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map(task => (
              <Link
                key={task.id}
                to={`/groups/${groupId}/tasks/${task.id}`}
                className={`block p-4 rounded-lg border-2 ${
                  STATUS_COLORS[task.status]
                } hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${PRIORITY_DOTS[task.priority]}`} />
                    <span className="text-sm font-medium capitalize">{task.priority} Priority</span>
                  </div>
                  <span className="text-xs font-medium capitalize px-2 py-1 rounded bg-white bg-opacity-50">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {task.task_assignments?.length > 0 && (
                    <span>{task.task_assignments.length} assigned</span>
                  )}
                  {task.task_comments?.length > 0 && (
                    <span>{task.task_comments.length} comments</span>
                  )}
                  {task.task_labels?.length > 0 && (
                    <span>{task.task_labels.length} labels</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation and view switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm rounded ${
                view === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm rounded ${
                view === 'week'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 text-sm rounded ${
                view === 'day'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Day
            </button>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-1">
            <button
              onClick={goToPrevious}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-2">Status</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
                <span>To Do</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span>Blocked</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-2">Priority</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <span>Urgent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
