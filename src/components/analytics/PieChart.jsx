import { useMemo } from 'react'

export const PieChart = ({ data, title }) => {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  const segments = useMemo(() => {
    let currentAngle = -90 // Start at top
    
    return data.map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0
      const angle = (percentage / 100) * 360
      
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      // Calculate path for SVG arc
      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180
      
      const x1 = 50 + 40 * Math.cos(startRad)
      const y1 = 50 + 40 * Math.sin(startRad)
      const x2 = 50 + 40 * Math.cos(endRad)
      const y2 = 50 + 40 * Math.sin(endRad)
      
      const largeArc = angle > 180 ? 1 : 0
      
      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`

      return {
        ...item,
        percentage: percentage.toFixed(1),
        path
      }
    })
  }, [data, total])

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{title}</h3>
      <div className="flex items-center gap-8">
        {/* Pie chart */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.path}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {segment.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {segment.value}
                </div>
                <div className="text-xs text-gray-500">
                  {segment.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
