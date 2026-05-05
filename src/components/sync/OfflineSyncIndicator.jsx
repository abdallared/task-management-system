import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';

export default function OfflineSyncIndicator() {
  const { 
    isOnline, 
    isSyncing, 
    queueLength, 
    lastSyncTime, 
    syncStatus,
    sync,
    hasQueuedOperations 
  } = useOfflineSync();

  // Don't show if online and no queued operations
  if (isOnline && !hasQueuedOperations && !isSyncing && !syncStatus) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border
        transition-all duration-300
        ${!isOnline 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
          : syncStatus === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : syncStatus === 'error'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }
      `}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {!isOnline ? (
            <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          ) : isSyncing ? (
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          ) : syncStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          {!isOnline ? (
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                You're offline
              </p>
              {hasQueuedOperations && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {queueLength} {queueLength === 1 ? 'change' : 'changes'} will sync when online
                </p>
              )}
            </div>
          ) : isSyncing ? (
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Syncing...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {queueLength} {queueLength === 1 ? 'operation' : 'operations'} remaining
              </p>
            </div>
          ) : syncStatus === 'success' ? (
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                All changes synced!
              </p>
              {lastSyncTime && (
                <p className="text-xs text-green-700 dark:text-green-300">
                  {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}
                </p>
              )}
            </div>
          ) : syncStatus === 'error' ? (
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Sync failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Will retry automatically
              </p>
            </div>
          ) : hasQueuedOperations ? (
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {queueLength} pending {queueLength === 1 ? 'change' : 'changes'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Click to sync now
              </p>
            </div>
          ) : null}
        </div>

        {/* Sync Button */}
        {isOnline && hasQueuedOperations && !isSyncing && (
          <button
            onClick={sync}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors touch-manipulation"
            aria-label="Sync now"
          >
            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {/* Last Sync Time (when online and no queue) */}
        {isOnline && !hasQueuedOperations && !syncStatus && lastSyncTime && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
