import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useLabels } from '../../hooks/useLabels'

export default function TaskLabels({ task, groupId, editable = false }) {
  const { labels: allLabels, assignLabel, removeLabel } = useLabels(groupId)
  const [showAddLabel, setShowAddLabel] = useState(false)

  const taskLabels = task.task_labels || []
  const taskLabelIds = taskLabels.map(tl => tl.label?.id).filter(Boolean)
  const availableLabels = allLabels.filter(label => !taskLabelIds.includes(label.id))

  const handleAddLabel = (labelId) => {
    assignLabel({ taskId: task.id, labelId })
    setShowAddLabel(false)
  }

  const handleRemoveLabel = (labelId) => {
    removeLabel({ taskId: task.id, labelId })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Existing Labels */}
      {taskLabels.map((taskLabel) => {
        const label = taskLabel.label
        if (!label) return null

        return (
          <div
            key={taskLabel.id}
            className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            <span>{label.name}</span>
            {editable && (
              <button
                onClick={() => handleRemoveLabel(label.id)}
                className="hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                title="Remove label"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add Label Button */}
      {editable && (
        <div className="relative">
          <button
            onClick={() => setShowAddLabel(!showAddLabel)}
            className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Add label"
          >
            <Plus className="w-3 h-3" />
            <span>Label</span>
          </button>

          {/* Label Dropdown */}
          {showAddLabel && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddLabel(false)}
              />
              <div className="absolute left-0 top-full mt-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
                {availableLabels.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No more labels available
                  </p>
                ) : (
                  availableLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleAddLabel(label.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {label.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
