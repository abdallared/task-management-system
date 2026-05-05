import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationList from './NotificationList'

export default function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <>
      <button
        onClick={() => setShowNotifications(true)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <NotificationList onClose={() => setShowNotifications(false)} />
      )}
    </>
  )
}
