// Offline Sync Service
// Handles queuing operations when offline and syncing when back online

const SYNC_QUEUE_KEY = 'taskflow_sync_queue';
const LAST_SYNC_KEY = 'taskflow_last_sync';

// Get sync queue from localStorage
export const getSyncQueue = () => {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
};

// Save sync queue to localStorage
export const saveSyncQueue = (queue) => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving sync queue:', error);
  }
};

// Add operation to sync queue
export const queueOperation = (operation) => {
  const queue = getSyncQueue();
  const newOperation = {
    id: Date.now() + Math.random(), // Unique ID
    timestamp: new Date().toISOString(),
    ...operation
  };
  queue.push(newOperation);
  saveSyncQueue(queue);
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('syncQueueUpdated', { 
    detail: { queueLength: queue.length } 
  }));
  
  return newOperation;
};

// Remove operation from queue
export const removeFromQueue = (operationId) => {
  const queue = getSyncQueue();
  const newQueue = queue.filter(op => op.id !== operationId);
  saveSyncQueue(newQueue);
  
  window.dispatchEvent(new CustomEvent('syncQueueUpdated', { 
    detail: { queueLength: newQueue.length } 
  }));
};

// Clear entire queue
export const clearSyncQueue = () => {
  saveSyncQueue([]);
  window.dispatchEvent(new CustomEvent('syncQueueUpdated', { 
    detail: { queueLength: 0 } 
  }));
};

// Get last sync time
export const getLastSyncTime = () => {
  return localStorage.getItem(LAST_SYNC_KEY);
};

// Update last sync time
export const updateLastSyncTime = () => {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
};

// Process sync queue
export const processSyncQueue = async (supabase) => {
  const queue = getSyncQueue();
  
  if (queue.length === 0) {
    return { success: true, processed: 0, failed: 0 };
  }

  console.log(`Processing ${queue.length} queued operations...`);
  
  let processed = 0;
  let failed = 0;
  const failedOperations = [];

  for (const operation of queue) {
    try {
      await executeOperation(operation, supabase);
      removeFromQueue(operation.id);
      processed++;
      console.log(`✓ Synced: ${operation.type}`, operation);
    } catch (error) {
      console.error(`✗ Failed to sync: ${operation.type}`, error);
      failed++;
      failedOperations.push(operation);
    }
  }

  // Update last sync time
  updateLastSyncTime();

  // Dispatch sync complete event
  window.dispatchEvent(new CustomEvent('syncCompleted', { 
    detail: { processed, failed, total: queue.length } 
  }));

  return { success: failed === 0, processed, failed, failedOperations };
};

// Execute a single operation
const executeOperation = async (operation, supabase) => {
  const { type, table, data, id } = operation;

  switch (type) {
    case 'INSERT': {
      const { error: insertError } = await supabase
        .from(table)
        .insert(data);
      if (insertError) throw insertError;
      break;
    }

    case 'UPDATE': {
      const { error: updateError } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);
      if (updateError) throw updateError;
      break;
    }

    case 'DELETE': {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;
      break;
    }

    case 'UPSERT': {
      const { error: upsertError } = await supabase
        .from(table)
        .upsert(data);
      if (upsertError) throw upsertError;
      break;
    }

    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
};

// Check if online
export const isOnline = () => {
  return navigator.onLine;
};

// Wrapper for database operations that handles offline queueing
export const offlineAwareOperation = async (operation, executeNow) => {
  if (isOnline()) {
    try {
      // Try to execute immediately
      const result = await executeNow();
      return { success: true, result, queued: false };
    } catch (error) {
      // If fails, queue it
      console.warn('Operation failed, queueing for later:', error);
      queueOperation(operation);
      return { success: false, error, queued: true };
    }
  } else {
    // Offline - queue the operation
    queueOperation(operation);
    return { success: false, queued: true, offline: true };
  }
};
