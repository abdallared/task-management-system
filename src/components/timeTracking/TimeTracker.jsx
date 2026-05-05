import { useState, useEffect } from 'react'
import { useTimeTracking } from '../../hooks/useTimeTracking'
import { formatDuration, formatDateTime } from '../../utils/dateUtils'

export const TimeTracker = ({ taskId }) => {
  const {
    timeEntries,
    activeTimer,
    totalTime,
    isLoading,
    startTimer,
    stopTimer,
    addManualEntry,
    deleteEntry,
    isStarting,
    isStopping
  } = useTimeTracking(taskId)

  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualStartTime, setManualStartTime] = useState('')
  const [manualEndTime, setManualEndTime] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [stopNotes, setStopNotes] = useState('')
  const [showStopModal, setShowStopModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update current time every second for live timer display
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer])

  const handleStartTimer = () => {
    startTimer()
  }

  const handleStopTimer = () => {
    setShowStopModal(true)
  }

  const confirmStopTimer = () => {
    stopTimer({ entryId: activeTimer.id, notes: stopNotes || null })
    setShowStopModal(false)
    setStopNotes('')
  }

  const handleAddManualEntry = (e) => {
    e.preventDefault()
    if (!manualStartTime || !manualEndTime) return

    addManualEntry({
      startTime: manualStartTime,
      endTime: manualEndTime,
      notes: manualNotes || null
    })

    setManualStartTime('')
    setManualEndTime('')
    setManualNotes('')
    setShowManualEntry(false)
  }

  const getElapsedTime = () => {
    if (!activeTimer) return 0
    const startTime = new Date(activeTimer.start_time).getTime()
    return Math.floor((currentTime - startTime) / 1000)
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading time tracking...</div>
  }

  return (
    <div className="space-y-4">
      {/* Timer Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Time Tracker</h3>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{formatDuration(totalTime)}</span>
          </div>
        </div>

        {activeTimer ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600 font-medium mb-1">Timer Running</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatDuration(getElapsedTime())}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Started at {formatDateTime(activeTimer.start_time)}
                  </div>
                </div>
                <button
                  onClick={handleStopTimer}
                  disabled={isStopping}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isStopping ? 'Stopping...' : 'Stop'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleStartTimer}
              disabled={isStarting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStarting ? 'Starting...' : 'Start Timer'}
            </button>
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Manual Entry
            </button>
          </div>
        )}

        {/* Manual Entry Form */}
        {showManualEntry && !activeTimer && (
          <form onSubmit={handleAddManualEntry} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Add Manual Time Entry</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add notes about this time entry..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualEntry(false)
                  setManualStartTime('')
                  setManualEndTime('')
                  setManualNotes('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Time Entries List */}
      {timeEntries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Time Logs</h4>
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {entry.duration ? formatDuration(entry.duration) : 'In progress...'}
                    </span>
                    {!entry.end_time && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDateTime(entry.start_time)}
                    {entry.end_time && ` - ${formatDateTime(entry.end_time)}`}
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-gray-500 mt-1 italic">
                      {entry.notes}
                    </div>
                  )}
                </div>
                {entry.end_time && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this time entry?')) {
                        deleteEntry(entry.id)
                      }
                    }}
                    className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete entry"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stop Timer Modal */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stop Timer</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add notes (optional)
              </label>
              <textarea
                value={stopNotes}
                onChange={(e) => setStopNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="What did you work on?"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowStopModal(false)
                  setStopNotes('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStopTimer}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
