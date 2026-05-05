# 📴 Offline Sync Guide

**Date**: May 5, 2026

---

## 🎯 How Offline Sync Works

TaskFlow now has **automatic offline sync** that queues your changes when offline and syncs them when you're back online!

---

## ✨ Features

### 1. **Automatic Detection** 📡
- Detects when you go offline
- Detects when you come back online
- Shows status indicator

### 2. **Operation Queueing** 📝
- Queues all changes made while offline
- Stores in browser localStorage
- Persists across page refreshes

### 3. **Auto-Sync** 🔄
- Automatically syncs when back online
- Processes queue in order
- Retries failed operations

### 4. **Visual Feedback** 👁️
- Shows offline status
- Displays queue length
- Shows sync progress
- Confirms when synced

---

## 🔄 Sync Process

### When You Go Offline:

```
1. You lose internet connection
2. Indicator shows "You're offline"
3. You continue working normally
4. All changes are queued locally
5. Queue count increases
```

### When You Come Back Online:

```
1. Internet connection restored
2. Indicator shows "Back online!"
3. Auto-sync starts immediately
4. Shows "Syncing... X operations"
5. Processes each queued operation
6. Shows "All changes synced!"
7. Indicator disappears after 3 seconds
```

---

## 📊 Visual Indicators

### Offline State
```
┌─────────────────────────────────┐
│ 📴 You're offline               │
│    3 changes will sync when     │
│    online                       │
└─────────────────────────────────┘
```

### Syncing State
```
┌─────────────────────────────────┐
│ 🔄 Syncing...                   │
│    3 operations remaining       │
└─────────────────────────────────┘
```

### Success State
```
┌─────────────────────────────────┐
│ ✓ All changes synced!           │
│   2 minutes ago                 │
└─────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────┐
│ ⚠ Sync failed                   │
│   Will retry automatically      │
└─────────────────────────────────┘
```

---

## 🎮 User Actions

### Manual Sync
If you have pending changes and want to sync immediately:
1. Click the **refresh icon** (🔄) on the indicator
2. Sync starts immediately
3. Watch progress in real-time

### View Queue
The indicator shows:
- Number of pending operations
- Last sync time
- Current sync status

---

## 🔧 What Gets Synced

### Supported Operations:

✅ **Create** (INSERT)
- New tasks
- New comments
- New labels
- New time entries

✅ **Update** (UPDATE)
- Task edits
- Status changes
- Assignment changes
- Label updates

✅ **Delete** (DELETE)
- Task deletions
- Comment deletions
- Label deletions

✅ **Upsert** (UPSERT)
- Complex updates
- Conflict resolution

---

## 💾 Data Storage

### Where Data is Stored:

**While Offline**:
- Browser localStorage
- Key: `taskflow_sync_queue`
- Persists across sessions

**Queue Structure**:
```json
[
  {
    "id": 1234567890.123,
    "timestamp": "2026-05-05T10:30:00Z",
    "type": "INSERT",
    "table": "tasks",
    "data": { "title": "New Task", ... }
  },
  {
    "id": 1234567891.456,
    "timestamp": "2026-05-05T10:31:00Z",
    "type": "UPDATE",
    "table": "tasks",
    "id": "task-uuid",
    "data": { "status": "done" }
  }
]
```

---

## 🚀 How to Use

### 1. **Work Normally**
Just use TaskFlow as usual. The offline sync works automatically in the background.

### 2. **Go Offline**
- Turn off WiFi
- Lose internet connection
- Enter airplane mode

### 3. **Make Changes**
- Create tasks
- Edit tasks
- Add comments
- Update status
- Everything is queued

### 4. **Come Back Online**
- Turn on WiFi
- Restore connection
- Changes sync automatically!

---

## 🎯 Example Scenarios

### Scenario 1: Commute
```
1. Open TaskFlow on phone
2. Enter subway (lose signal)
3. Create 3 new tasks
4. Edit 2 existing tasks
5. Exit subway (get signal)
6. All 5 changes sync automatically!
```

### Scenario 2: Airplane
```
1. Open TaskFlow on laptop
2. Board plane, enable airplane mode
3. Work on tasks for 2 hours
4. Land, disable airplane mode
5. All changes sync in seconds!
```

### Scenario 3: Spotty Connection
```
1. Working with unstable WiFi
2. Connection drops randomly
3. Changes queue automatically
4. Connection restored
5. Auto-sync happens
6. No data loss!
```

---

## ⚠️ Important Notes

### Limitations:

1. **Real-time Updates**
   - Won't receive updates from others while offline
   - Sync only sends your changes, doesn't fetch new data
   - Refresh page after sync to get latest data

2. **Conflicts**
   - If someone else edited the same task, last write wins
   - No automatic conflict resolution (yet)
   - Manual resolution may be needed

3. **Storage Limits**
   - localStorage has ~5-10MB limit
   - Very large queues may hit limit
   - Sync regularly to avoid issues

4. **Complex Operations**
   - Some operations may fail if dependencies changed
   - Failed operations stay in queue
   - Manual retry or removal may be needed

---

## 🔍 Technical Details

### Service Worker
- Caches app shell for offline access
- Network-first strategy for data
- Fallback to cache when offline

### Sync Queue
- Stored in localStorage
- Survives page refresh
- Processed in FIFO order

### Event System
- `online` event → triggers auto-sync
- `offline` event → shows indicator
- `syncQueueUpdated` → updates UI
- `syncCompleted` → shows result

---

## 🛠️ For Developers

### Using Offline Sync in Components

```javascript
import { useOfflineSync } from '../hooks/useOfflineSync';

function MyComponent() {
  const { 
    isOnline, 
    isSyncing, 
    queueLength, 
    sync 
  } = useOfflineSync();

  return (
    <div>
      {!isOnline && <p>Offline mode</p>}
      {queueLength > 0 && (
        <button onClick={sync}>
          Sync {queueLength} changes
        </button>
      )}
    </div>
  );
}
```

### Queueing Operations

```javascript
import { queueOperation } from '../services/offlineSync';

// Queue a create operation
queueOperation({
  type: 'INSERT',
  table: 'tasks',
  data: { title: 'New Task', ... }
});

// Queue an update operation
queueOperation({
  type: 'UPDATE',
  table: 'tasks',
  id: 'task-uuid',
  data: { status: 'done' }
});

// Queue a delete operation
queueOperation({
  type: 'DELETE',
  table: 'tasks',
  id: 'task-uuid'
});
```

### Offline-Aware Operations

```javascript
import { offlineAwareOperation } from '../services/offlineSync';

const result = await offlineAwareOperation(
  {
    type: 'INSERT',
    table: 'tasks',
    data: taskData
  },
  async () => {
    // Try to execute immediately
    return await supabase.from('tasks').insert(taskData);
  }
);

if (result.queued) {
  console.log('Operation queued for later');
} else {
  console.log('Operation completed immediately');
}
```

---

## 🎨 Customization

### Hide Indicator
If you want to hide the indicator:
```javascript
// In Layout.jsx, comment out:
// <OfflineSyncIndicator />
```

### Change Auto-Sync Behavior
```javascript
// In useOfflineSync.js, modify handleOnline:
const handleOnline = async () => {
  setIsOnlineState(true);
  
  // Option 1: Auto-sync (current)
  await sync();
  
  // Option 2: Ask user first
  if (confirm('Sync queued changes?')) {
    await sync();
  }
  
  // Option 3: Don't auto-sync
  // (user must click sync button)
};
```

---

## 📊 Monitoring

### Check Queue Status
```javascript
import { getSyncQueue } from '../services/offlineSync';

const queue = getSyncQueue();
console.log(`${queue.length} operations queued`);
console.log(queue);
```

### Check Last Sync
```javascript
import { getLastSyncTime } from '../services/offlineSync';

const lastSync = getLastSyncTime();
console.log(`Last synced: ${lastSync}`);
```

### Clear Queue (Emergency)
```javascript
import { clearSyncQueue } from '../services/offlineSync';

clearSyncQueue();
console.log('Queue cleared');
```

---

## 🐛 Troubleshooting

### Queue Not Syncing?
1. Check internet connection
2. Open browser console
3. Look for sync errors
4. Try manual sync button
5. Check localStorage quota

### Operations Failing?
1. Check operation format
2. Verify table/column names
3. Check RLS policies
4. Look for validation errors

### Indicator Not Showing?
1. Check if OfflineSyncIndicator is in Layout
2. Verify date-fns is installed
3. Check browser console for errors

---

## ✅ Best Practices

### For Users:
1. ✅ Sync regularly when online
2. ✅ Don't accumulate huge queues
3. ✅ Refresh after sync to get latest data
4. ✅ Watch for sync errors

### For Developers:
1. ✅ Use offlineAwareOperation wrapper
2. ✅ Handle sync failures gracefully
3. ✅ Test offline scenarios
4. ✅ Monitor queue size
5. ✅ Implement conflict resolution

---

## 🎉 Summary

TaskFlow now has **full offline support**!

✅ **Works offline** - Continue working without internet
✅ **Auto-queues** - All changes saved locally
✅ **Auto-syncs** - Syncs when back online
✅ **Visual feedback** - Always know sync status
✅ **No data loss** - Everything is preserved

**You can now work anywhere, anytime!** 📱✨

---

## 📖 Related Files

- `src/services/offlineSync.js` - Core sync logic
- `src/hooks/useOfflineSync.js` - React hook
- `src/components/sync/OfflineSyncIndicator.jsx` - UI component
- `public/sw.js` - Service worker (caching)

---

**Your TaskFlow PWA now works offline!** 🎊
