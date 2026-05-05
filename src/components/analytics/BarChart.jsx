import { useMemo } from 'react'

export const BarChart = ({ data, title, color = '#3b82f6' }) => {
  const maxValue = useMemo(() => {
    return Math.max(...data.map(item => item.value), 1)
  }, [data])

  if (data.length === 0) {
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
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 truncate max-w-[200px]">
                  {item.label}
                </span>
                <span className="text-gray-900 font-semibold ml-2">
                  {item.value}
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color
                    }}
                  >
                    {percentage > 15 && (
                      <span className="text-xs font-medium text-white">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
