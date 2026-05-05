import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react'
import { useLabels } from '../../hooks/useLabels'

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
  '#6b7280', // gray
]

export default function ManageLabelsModal({ groupId, onClose }) {
  const { labels, createLabel, updateLabel, deleteLabel, isCreating, isDeleting } = useLabels(groupId)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')
  const [editingLabel, setEditingLabel] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreateLabel = (e) => {
    e.preventDefault()
    if (!newLabelName.trim()) return

    createLabel({
      group_id: groupId,
      name: newLabelName.trim(),
      color: newLabelColor
    }, {
      onSuccess: () => {
        setNewLabelName('')
        setNewLabelColor('#3b82f6')
      }
    })
  }

  const startEdit = (label) => {
    setEditingLabel(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  const handleUpdateLabel = (labelId) => {
    if (!editName.trim()) return

    updateLabel({
      labelId,
      updates: {
        name: editName.trim(),
        color: editColor
      }
    }, {
      onSuccess: () => {
        setEditingLabel(null)
      }
    })
  }

  const handleDeleteLabel = (labelId) => {
    if (window.confirm('Delete this label? It will be removed from all tasks.')) {
      deleteLabel(labelId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Manage Labels
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Label */}
          <form onSubmit={handleCreateLabel} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Create New Label
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="input flex-1"
                maxLength={50}
              />
              <div className="relative">
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                  title="Choose color"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newLabelName.trim()}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Color Presets */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick colors:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      newLabelColor === color
                        ? 'border-gray-900 dark:border-gray-100 scale-110'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Existing Labels */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Existing Labels ({labels.length})
            </h3>
            {labels.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No labels yet. Create one above!
              </p>
            ) : (
              <div className="space-y-2">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    {editingLabel === label.id ? (
                      <>
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input flex-1"
                          maxLength={50}
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateLabel(label.id)}
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-green-600"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingLabel(null)}
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-10 h-10 rounded flex-shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                          {label.name}
                        </span>
                        <button
                          onClick={() => startEdit(label)}
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLabel(label.id)}
                          disabled={isDeleting}
                          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
