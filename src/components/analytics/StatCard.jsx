import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export const StatCard = ({ title, value, subtitle, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  }

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getTrendText = () => {
    if (!trend) return null
    const absValue = Math.abs(trend)
    const color = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
    return (
      <span className={`text-sm font-medium ${color}`}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            {getTrendText()}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
