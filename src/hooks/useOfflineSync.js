import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
  getSyncQueue,
  processSyncQueue,
  getLastSyncTime,
  isOnline
} from '../services/offlineSync';

export const useOfflineSync = () => {
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  // Update queue length
  const updateQueueLength = () => {
    const queue = getSyncQueue();
    setQueueLength(queue.length);
  };

  // Update last sync time
  const updateLastSync = () => {
    const lastSync = getLastSyncTime();
    setLastSyncTime(lastSync);
  };

  // Sync queued operations
  const sync = async () => {
    if (!isOnline() || isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const result = await processSyncQueue(supabase);
      
      if (result.success) {
        setSyncStatus('success');
        console.log(`✓ Sync complete: ${result.processed} operations synced`);
      } else {
        setSyncStatus('partial');
        console.warn(`⚠ Partial sync: ${result.processed} synced, ${result.failed} failed`);
      }

      updateQueueLength();
      updateLastSync();

      // Clear status after 3 seconds
      setTimeout(() => setSyncStatus(null), 3000);

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 3000);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      console.log('📡 Back online!');
      setIsOnlineState(true);
      
      // Auto-sync when coming back online
      const queue = getSyncQueue();
      if (queue.length > 0) {
        console.log(`🔄 Auto-syncing ${queue.length} queued operations...`);
        await sync();
      }
    };

    const handleOffline = () => {
      console.log('📴 Gone offline');
      setIsOnlineState(false);
    };

    const handleSyncQueueUpdated = (event) => {
      setQueueLength(event.detail.queueLength);
    };

    const handleSyncCompleted = (event) => {
      console.log('Sync completed:', event.detail);
      updateLastSync();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncQueueUpdated', handleSyncQueueUpdated);
    window.addEventListener('syncCompleted', handleSyncCompleted);

    // Initial setup
    updateQueueLength();
    updateLastSync();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncQueueUpdated', handleSyncQueueUpdated);
      window.removeEventListener('syncCompleted', handleSyncCompleted);
    };
  }, []);

  return {
    isOnline: isOnlineState,
    isSyncing,
    queueLength,
    lastSyncTime,
    syncStatus,
    sync,
    hasQueuedOperations: queueLength > 0
  };
};
