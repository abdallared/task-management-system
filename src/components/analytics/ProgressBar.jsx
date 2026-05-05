export const ProgressBar = ({ label, value, max, color = 'blue', showPercentage = true }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {value} / {max}
          {showPercentage && ` (${percentage}%)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
