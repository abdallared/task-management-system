# Distributed Systems Patterns & Best Practices

**TaskFlow Implementation Guide**

---

## Table of Contents
1. [Communication Patterns](#communication-patterns)
2. [Consistency Patterns](#consistency-patterns)
3. [Fault Tolerance Patterns](#fault-tolerance-patterns)
4. [Performance Patterns](#performance-patterns)
5. [Security Patterns](#security-patterns)
6. [Scalability Patterns](#scalability-patterns)

---

## Communication Patterns

### 1. Request-Reply Pattern

**Description:** Client sends request, waits for response; synchronous communication.

**When to Use:**
- Need immediate feedback
- Operations are atomic
- Client needs result to proceed

**TaskFlow Implementation:**
```javascript
// Request-Reply: Get task details
async function getTaskWithDetails(taskId) {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error) throw error;
    return task;
  } catch (error) {
    console.error('Failed to fetch task:', error);
    throw error;
  }
}

// Usage
const task = await getTaskWithDetails('123');
console.log('Task loaded:', task.title);
```

**Advantages:**
- Simple to understand and implement
- Synchronous - no race conditions
- Immediate feedback

**Disadvantages:**
- Blocking - client waits
- Network latency affects UX
- Server must be available

### 2. Publish-Subscribe (Asynchronous Events)

**Description:** Decoupled communication; publishers send events, subscribers receive them.

**When to Use:**
- Multiple consumers of same event
- Loose coupling required
- Asynchronous processing acceptable

**TaskFlow Implementation:**
```javascript
// Publisher: Task update event
async function updateTaskAndNotify(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  if (!error) {
    // Publish event
    eventBus.emit('task:updated', {
      taskId,
      updates,
      timestamp: new Date(),
      updatedBy: currentUser.id
    });
  }
  
  return { data, error };
}

// Subscriber 1: Update UI
eventBus.on('task:updated', (event) => {
  updateTaskInLocalCache(event.taskId, event.updates);
  showNotification('Task updated');
});

// Subscriber 2: Send notification
eventBus.on('task:updated', async (event) => {
  const task = await getTask(event.taskId);
  if (task.assigned_to && task.assigned_to !== event.updatedBy) {
    await sendNotification(task.assigned_to, {
      title: 'Task Updated',
      message: `"${task.title}" was updated by ${event.updatedBy}`
    });
  }
});

// Subscriber 3: Track analytics
eventBus.on('task:updated', (event) => {
  analytics.track('task_updated', {
    taskId: event.taskId,
    changedFields: Object.keys(event.updates),
    userId: event.updatedBy
  });
});
```

**Using Supabase Realtime (Built-in Pub-Sub):**
```javascript
// Server broadcasts changes automatically
const channel = supabase.channel('tasks')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'tasks' 
    },
    (payload) => {
      console.log('Change received!', payload);
      if (payload.eventType === 'UPDATE') {
        // All connected clients receive update
        updateLocalUI(payload.new);
      }
    }
  )
  .subscribe();
```

**Advantages:**
- Loose coupling between components
- Scale to many subscribers
- Asynchronous - non-blocking

**Disadvantages:**
- Harder to debug (events may be lost)
- Eventual consistency (slight delay)
- Complex error handling

### 3. Message Queue Pattern

**Description:** Messages stored in queue, processed asynchronously; guarantees delivery.

**When to Use:**
- Must guarantee message delivery
- Heavy processing that can be deferred
- Load leveling needed

**TaskFlow Use Case:**
```javascript
// Queue task notification emails
class NotificationQueue {
  constructor(queueName = 'notifications') {
    this.queueName = queueName;
  }
  
  async enqueue(notification) {
    await supabase.from('notification_queue').insert({
      type: notification.type,
      recipient_id: notification.recipientId,
      message: notification.message,
      status: 'PENDING',
      attempts: 0,
      created_at: new Date().toISOString()
    });
  }
  
  async processQueue() {
    // Run periodically (every 5 minutes)
    const pending = await supabase
      .from('notification_queue')
      .select('*')
      .eq('status', 'PENDING')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);
    
    for (const item of pending.data) {
      try {
        await sendNotification(item.recipient_id, item.message);
        await supabase
          .from('notification_queue')
          .update({ status: 'SENT', updated_at: new Date() })
          .eq('id', item.id);
      } catch (error) {
        await supabase
          .from('notification_queue')
          .update({ 
            attempts: item.attempts + 1,
            last_error: error.message
          })
          .eq('id', item.id);
      }
    }
  }
}

// Start queue processor
const notificationQueue = new NotificationQueue();
setInterval(() => notificationQueue.processQueue(), 5 * 60 * 1000);

// Enqueue instead of sending immediately
async function assignTask(taskId, userId) {
  await supabase
    .from('tasks')
    .update({ assigned_to: userId })
    .eq('id', taskId);
  
  // Queue notification (asynchronous)
  const task = await getTask(taskId);
  await notificationQueue.enqueue({
    type: 'TASK_ASSIGNED',
    recipientId: userId,
    message: `You were assigned: ${task.title}`
  });
  
  return { success: true };
}
```

**Advantages:**
- Guaranteed delivery
- Load leveling (process when capacity available)
- Decouples producer and consumer

**Disadvantages:**
- More complex implementation
- Overhead of message store
- Potential for duplicate messages

---

## Consistency Patterns

### 1. Strong Consistency (Synchronous)

**Definition:** All nodes always see the same data; changes are atomic.

**When to Use:**
- Financial transactions
- Critical data integrity
- Small, latency-tolerant systems

**TaskFlow Implementation:**
```javascript
// Transactional task creation with constraints
async function createTaskWithSubtasks(taskData, subtasks) {
  // Single transaction ensures all-or-nothing
  const { data, error } = await supabase.rpc('create_task_with_subtasks', {
    p_title: taskData.title,
    p_description: taskData.description,
    p_group_id: taskData.groupId,
    p_subtasks: subtasks
  });
  
  if (!error) {
    // Either all created or none
    console.log('Task and subtasks created atomically');
  }
  
  return { data, error };
}

// SQL RPC with transaction
/*
CREATE OR REPLACE FUNCTION create_task_with_subtasks(
  p_title TEXT,
  p_description TEXT,
  p_group_id UUID,
  p_subtasks JSON
) RETURNS JSON AS $$
DECLARE
  v_task_id UUID;
BEGIN
  BEGIN
    -- Create main task
    INSERT INTO tasks (title, description, group_id)
    VALUES (p_title, p_description, p_group_id)
    RETURNING id INTO v_task_id;
    
    -- Create subtasks
    INSERT INTO subtasks (task_id, title, completed)
    SELECT v_task_id, obj->>'title', false
    FROM json_array_elements(p_subtasks) AS obj;
    
    RETURN json_build_object('taskId', v_task_id, 'success', true);
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE EXCEPTION 'Failed to create task: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;
*/
```

**Database Constraints for Consistency:**
```sql
-- Enforce referential integrity
ALTER TABLE tasks
ADD CONSTRAINT fk_group
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Enforce data constraints
ALTER TABLE tasks
ADD CONSTRAINT check_status
CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'));

-- Ensure no duplicate titles in same group
ALTER TABLE tasks
ADD CONSTRAINT unique_title_per_group
UNIQUE (group_id, title);

-- Version-based optimistic locking
ALTER TABLE tasks
ADD COLUMN version INTEGER DEFAULT 1;

-- Update function that checks version
CREATE OR REPLACE FUNCTION update_task_with_version(
  p_task_id UUID,
  p_version INTEGER,
  p_updates JSONB
) RETURNS JSON AS $$
BEGIN
  UPDATE tasks
  SET version = version + 1,
      updated_at = NOW(),
      title = COALESCE(p_updates->>'title', title),
      status = COALESCE(p_updates->>'status', status)
  WHERE id = p_task_id AND version = p_version;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Concurrent modification detected';
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

### 2. Eventual Consistency (Asynchronous)

**Definition:** Different nodes temporarily have different data; eventual convergence.

**When to Use:**
- Highly scalable systems
- Geographic distribution
- Performance more important than immediate consistency

**TaskFlow Implementation:**
```javascript
// Client updates cache optimistically, syncs later
async function updateTaskOptimistic(taskId, updates) {
  // 1. Update local cache immediately (optimistic)
  const oldTask = getLocalTask(taskId);
  setLocalTask(taskId, { ...oldTask, ...updates });
  
  try {
    // 2. Sync with server asynchronously
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (!error) {
      // 3. Server update succeeded, update cache with server response
      setLocalTask(taskId, data);
      return { success: true };
    } else {
      // 4. Server update failed, revert to old value
      setLocalTask(taskId, oldTask);
      return { success: false, error };
    }
  } catch (error) {
    // Network error - queue for later retry
    offlineSync.queue({
      type: 'UPDATE',
      taskId,
      updates,
      timestamp: Date.now()
    });
    
    // Keep optimistic update until sync succeeds
    return { success: true, sync: 'queued' };
  }
}

// Periodic reconciliation
async function reconcileWithServer() {
  const pendingChanges = await offlineSync.getPending();
  
  for (const change of pendingChanges) {
    try {
      const response = await supabase
        .from('tasks')
        .update(change.updates)
        .eq('id', change.taskId);
      
      if (!response.error) {
        await offlineSync.markSynced(change.id);
      }
    } catch (error) {
      console.error('Sync failed, will retry:', error);
    }
  }
}

// Conflict resolution during sync
async function resolveConflict(localVersion, serverVersion) {
  // Last-write-wins strategy
  if (localVersion.updated_at > serverVersion.updated_at) {
    return localVersion; // Use local if more recent
  }
  
  // Or use custom logic
  if (localVersion.changes_count > serverVersion.changes_count) {
    return localVersion; // Use version with more changes
  }
  
  return serverVersion; // Use server by default
}
```

**Real-Time Synchronization:**
```javascript
// Listen for server changes while offline changes pending
supabase.realtime.subscribe('tasks', (payload) => {
  if (payload.eventType === 'UPDATE') {
    const serverVersion = payload.new;
    const localVersion = getLocalTask(serverVersion.id);
    
    if (localVersion && localVersion.updated_at !== serverVersion.updated_at) {
      // Conflict detected
      const resolved = resolveConflict(localVersion, serverVersion);
      setLocalTask(resolved.id, resolved);
    } else {
      setLocalTask(serverVersion.id, serverVersion);
    }
  }
});
```

### 3. Causal Consistency

**Definition:** Operations with cause-effect relationships are ordered consistently.

**When to Use:**
- Collaborative systems where order matters
- Comments/replies where causality matters
- Dependency chains

**TaskFlow Implementation:**
```javascript
// Track causal dependencies using vector clocks
class VectorClock {
  constructor(clientId) {
    this.clientId = clientId;
    this.clock = new Map(); // { clientId -> timestamp }
  }
  
  increment() {
    this.clock.set(this.clientId, (this.clock.get(this.clientId) || 0) + 1);
  }
  
  merge(otherClock) {
    for (const [clientId, timestamp] of otherClock.entries()) {
      const current = this.clock.get(clientId) || 0;
      this.clock.set(clientId, Math.max(current, timestamp));
    }
  }
  
  happensBefore(other) {
    let atLeastOneLess = false;
    for (const [clientId, timestamp] of this.clock.entries()) {
      const otherTime = other.get(clientId) || 0;
      if (timestamp > otherTime) return false;
      if (timestamp < otherTime) atLeastOneLess = true;
    }
    return atLeastOneLess;
  }
  
  toJSON() {
    return Object.fromEntries(this.clock);
  }
}

// Use vector clocks for comments
async function addComment(taskId, commentText) {
  const vectorClock = new VectorClock(currentUserId);
  vectorClock.increment();
  
  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      text: commentText,
      user_id: currentUserId,
      vector_clock: vectorClock.toJSON(),
      created_at: new Date().toISOString()
    });
  
  return { data, error };
}

// Ensure comments are displayed in causal order
async function getCommentsInOrder(taskId) {
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  
  // Topological sort by vector clock
  return comments.sort((a, b) => {
    const aVec = new Map(Object.entries(a.vector_clock));
    const bVec = new Map(Object.entries(b.vector_clock));
    
    for (const [clientId, aTime] of aVec.entries()) {
      const bTime = bVec.get(clientId) || 0;
      if (aTime !== bTime) return aTime - bTime;
    }
    return 0;
  });
}
```

---

## Fault Tolerance Patterns

### 1. Retry with Exponential Backoff

**Description:** Automatically retry failed operations with increasing delays.

**When to Use:**
- Transient network failures
- Temporary server unavailability
- Rate limiting

**Implementation:**
```javascript
async function retryWithBackoff(
  fn,
  maxAttempts = 3,
  initialDelayMs = 1000,
  maxDelayMs = 10000
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) break;
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const exponentialDelay = initialDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
const tasks = await retryWithBackoff(
  () => supabase.from('tasks').select('*'),
  3, // max attempts
  1000, // initial delay
  10000 // max delay
);
```

### 2. Circuit Breaker Pattern

**Description:** Fail fast and prevent cascading failures.

**States:**
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Too many failures, fail immediately
- **HALF_OPEN**: Testing if service recovered

**Implementation:**
```javascript
class CircuitBreaker {
  constructor(
    threshold = 5, // Failures before opening
    timeout = 60000, // Timeout before trying again
    resetTimeout = 30000 // Time to try half-open
  ) {
    this.failureCount = 0;
    this.successCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN. Retry after ${this.nextAttemptTime - Date.now()}ms`);
      }
      // Try half-open
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 2) { // 2 successes to fully close
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('Circuit breaker CLOSED - service recovered');
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.nextAttemptTime = this.lastFailureTime + this.resetTimeout;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.log('Circuit breaker OPEN - service still down');
    } else if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.log(`Circuit breaker OPEN after ${this.failureCount} failures`);
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      lastFailure: this.lastFailureTime
    };
  }
}

// Usage
const apiCircuitBreaker = new CircuitBreaker(5, 60000);

async function fetchTasksWithCircuitBreaker() {
  return apiCircuitBreaker.execute(() =>
    supabase.from('tasks').select('*')
  );
}
```

### 3. Bulkhead Pattern (Isolation)

**Description:** Isolate resources to prevent one failure from affecting others.

**Implementation:**
```javascript
class Bulkhead {
  constructor(maxConcurrent = 10, maxQueueSize = 50) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.running = 0;
    this.queue = [];
    this.rejectedCount = 0;
  }
  
  async execute(fn, timeoutMs = 5000) {
    // Reject if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.rejectedCount++;
      throw new Error(`Bulkhead queue full (${this.rejectedCount} rejected)`);
    }
    
    return new Promise((resolve, reject) => {
      // Queue the request
      const task = { fn, resolve, reject, timeoutMs };
      
      if (this.running < this.maxConcurrent) {
        this.executeTask(task);
      } else {
        this.queue.push(task);
      }
    });
  }
  
  async executeTask(task) {
    this.running++;
    
    const timeoutId = setTimeout(() => {
      task.reject(new Error('Task timeout'));
    }, task.timeoutMs);
    
    try {
      const result = await task.fn();
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      clearTimeout(timeoutId);
      this.running--;
      
      // Process next queued task
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        this.executeTask(nextTask);
      }
    }
  }
  
  getMetrics() {
    return {
      running: this.running,
      queued: this.queue.length,
      rejected: this.rejectedCount,
      utilization: `${Math.round(this.running / this.maxConcurrent * 100)}%`
    };
  }
}

// Separate bulkheads for different operations
const readBulkhead = new Bulkhead(20, 100); // More read capacity
const writeBulkhead = new Bulkhead(5, 50); // Less write capacity

async function getTasks() {
  return readBulkhead.execute(() =>
    supabase.from('tasks').select('*')
  );
}

async function createTask(taskData) {
  return writeBulkhead.execute(() =>
    supabase.from('tasks').insert([taskData])
  );
}
```

---

## Performance Patterns

### 1. Caching Strategy

**Description:** Store frequently accessed data closer to users.

**Multi-Level Caching:**
```javascript
class CacheManager {
  constructor() {
    this.memory = new Map(); // L1: In-memory
    this.indexedDB = null; // L2: IndexedDB
  }
  
  async get(key) {
    // Check L1 first
    if (this.memory.has(key)) {
      return this.memory.get(key);
    }
    
    // Check L2
    const value = await this.getFromIndexedDB(key);
    if (value) {
      this.memory.set(key, value); // Promote to L1
      return value;
    }
    
    return null;
  }
  
  async set(key, value, ttl = 3600) {
    // Write to both levels
    this.memory.set(key, { value, expires: Date.now() + ttl * 1000 });
    await this.setInIndexedDB(key, value, ttl);
  }
  
  async setInIndexedDB(key, value, ttl) {
    const db = await this.getDB();
    const store = db.transaction('cache', 'readwrite').objectStore('cache');
    await store.put({
      key,
      value,
      expires: Date.now() + ttl * 1000
    });
  }
  
  async getFromIndexedDB(key) {
    const db = await this.getDB();
    const store = db.transaction('cache', 'readonly').objectStore('cache');
    const record = await store.get(key);
    
    if (record && record.expires > Date.now()) {
      return record.value;
    }
    
    return null;
  }
  
  async getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('taskflow', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage with React Query
const cacheManager = new CacheManager();

const useTasksWithCache = () => {
  return useQuery('tasks', async () => {
    // Check cache first
    let tasks = await cacheManager.get('tasks:all');
    
    if (!tasks) {
      // Fetch from server
      const { data } = await supabase.from('tasks').select('*');
      tasks = data;
      
      // Cache result
      await cacheManager.set('tasks:all', tasks, 300); // 5 minutes
    }
    
    return tasks;
  });
};
```

**Cache Invalidation:**
```javascript
// Pattern: Invalidate on mutation
async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
  
  if (!error) {
    // Invalidate related caches
    queryClient.invalidateQueries('tasks'); // All tasks
    queryClient.invalidateQueries(['task', taskId]); // Specific task
    queryClient.invalidateQueries('tasks:group:' + groupId); // Group tasks
  }
  
  return { data, error };
}

// Cache versioning strategy
async function getCacheKey(resource, version = null) {
  if (version) {
    return `${resource}:v${version}`;
  }
  const currentVersion = await getVersion(resource);
  return `${resource}:v${currentVersion}`;
}
```

### 2. Data Pagination & Pagination

**Description:** Fetch and display data in chunks.

**Implementation:**
```javascript
async function getTasks(page = 0, pageSize = 50) {
  const start = page * pageSize;
  const end = start + pageSize - 1;
  
  const { data, count, error } = await supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .range(start, end)
    .order('created_at', { ascending: false });
  
  return {
    tasks: data,
    totalCount: count,
    pageCount: Math.ceil(count / pageSize),
    currentPage: page,
    hasMore: (page + 1) * pageSize < count,
    error
  };
}

// Cursor-based pagination (more efficient)
async function getTasksCursor(cursor = null, limit = 50) {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit + 1); // +1 to check if more exist
  
  if (cursor) {
    query = query.lt('id', cursor);
  }
  
  const { data, error } = await query;
  
  return {
    tasks: data.slice(0, limit),
    nextCursor: data.length > limit ? data[limit - 1].id : null,
    hasMore: data.length > limit,
    error
  };
}

// Infinite scroll component
function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const loadMore = async () => {
    const { tasks: newTasks, nextCursor, hasMore: more } = await getTasksCursor(cursor);
    setTasks(prev => [...prev, ...newTasks]);
    setCursor(nextCursor);
    setHasMore(more);
  };
  
  return (
    <InfiniteScroll
      dataLength={tasks.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<Spinner />}
    >
      {tasks.map(task => <TaskCard key={task.id} task={task} />)}
    </InfiniteScroll>
  );
}
```

### 3. Batch Processing

**Description:** Process multiple operations together.

**Implementation:**
```javascript
// Batch updates
async function batchUpdateTasks(updates) {
  const { error } = await supabase.from('tasks').upsert(updates);
  return { error };
}

// Usage: Collect updates and flush periodically
class BatchQueue {
  constructor(flushInterval = 5000, maxBatchSize = 100) {
    this.queue = [];
    this.flushInterval = flushInterval;
    this.maxBatchSize = maxBatchSize;
    this.timeoutId = null;
  }
  
  enqueue(item) {
    this.queue.push(item);
    
    // Flush if batch is full
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timeoutId) {
      // Schedule flush
      this.timeoutId = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const items = this.queue.splice(0);
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
    
    try {
      await batchUpdateTasks(items);
    } catch (error) {
      console.error('Batch update failed:', error);
      this.queue.unshift(...items); // Re-queue failed items
    }
  }
}

const updateQueue = new BatchQueue();

// Queue updates instead of sending immediately
function updateTaskStatus(taskId, status) {
  updateQueue.enqueue({
    id: taskId,
    status,
    updated_at: new Date().toISOString()
  });
}
```

---

## Security Patterns

### 1. Row-Level Security (RLS)

**Description:** Database enforces access control at row level.

**TaskFlow Implementation:**
```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see tasks in their groups
CREATE POLICY "Users can view group tasks"
  ON tasks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = tasks.group_id
    )
  );

-- Policy: Only task creator or group admin can update
CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  USING (
    (auth.uid() = created_by) OR
    (auth.uid() IN (
      SELECT user_id FROM group_members
      WHERE group_id = tasks.group_id AND role = 'admin'
    ))
  );

-- Policy: Only group admin can delete
CREATE POLICY "Only admins can delete tasks"
  ON tasks
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM group_members
      WHERE group_id = tasks.group_id AND role = 'admin'
    )
  );
```

**Testing RLS:**
```javascript
// Test that non-members can't see group tasks
const { data: tasksAsNonMember } = await supabaseAsUser2
  .from('tasks')
  .select('*')
  .eq('group_id', groupId);

console.assert(tasksAsNonMember.length === 0, 'Non-members should not see tasks');
```

### 2. Token-Based Authentication

**Description:** Use JWT tokens for API authentication.

**Implementation:**
```javascript
// Login and get token
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (!error) {
    const { access_token, refresh_token } = data.session;
    
    // Store tokens securely
    await secureStorage.setItem('access_token', access_token);
    await secureStorage.setItem('refresh_token', refresh_token);
  }
  
  return { data, error };
}

// Automatically refresh token before expiry
async function ensureValidToken() {
  const token = await secureStorage.getItem('access_token');
  const decoded = decodeJwt(token);
  
  if (decoded.exp * 1000 < Date.now() + 5 * 60 * 1000) { // Expires in < 5 min
    const { data } = await supabase.auth.refreshSession();
    await secureStorage.setItem('access_token', data.session.access_token);
  }
}

// Intercept all requests to add token
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  await ensureValidToken();
  const token = await secureStorage.getItem('access_token');
  
  return originalFetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
};
```

### 3. Data Encryption

**Description:** Encrypt sensitive data at rest and in transit.

**In Transit (HTTPS):**
```javascript
// All requests use HTTPS
const supabaseUrl = 'https://xyz.supabase.co'; // Always HTTPS
const supabase = createClient(supabaseUrl, anonKey);
```

**At Rest (Encrypted Fields):**
```javascript
// Encrypt sensitive task descriptions
import crypto from 'crypto';

async function createSecureTask(taskData, secretKey) {
  const encryptedDescription = encrypt(taskData.description, secretKey);
  
  return await supabase.from('tasks').insert({
    title: taskData.title,
    description: encryptedDescription, // Encrypted in DB
    group_id: taskData.groupId
  });
}

function encrypt(text, secretKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted, secretKey) {
  const [iv, encrypted...] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## Scalability Patterns

### 1. Horizontal Scaling (More Servers)

**Database Read Replicas:**
```javascript
// Route reads to read-only replicas
const readSupabase = createClient(supabaseUrl, anonKey, {
  db: { schema: 'public' }
});

async function readOptimized(table) {
  // Try read replica first
  try {
    return await readSupabase.from(table).select('*');
  } catch {
    // Fallback to primary
    return await supabase.from(table).select('*');
  }
}
```

**Connection Pooling:**
```javascript
// Supabase handles connection pooling automatically
// For high throughput, use connection pool mode
const supabaseUrl = 'https://xyz.supabase.co';
const poolingUrl = 'https://xyz.supabase.co:6543'; // Connection pool mode
```

### 2. Vertical Scaling (Bigger Server)

**Database Resource Upgrade:**
```javascript
// Supabase Pro plan includes:
// - Up to 4GB RAM
// - 100,000 concurrent connections
// - Dedicated compute
```

### 3. Geographic Distribution

**Multi-region Deployment:**
```javascript
// Select nearest Supabase instance based on user location
const regions = {
  'US': 'https://us.supabase.co',
  'EU': 'https://eu.supabase.co',
  'APAC': 'https://apac.supabase.co'
};

async function getRegion() {
  const response = await fetch('https://ipapi.co/json/');
  const { continent_code } = await response.json();
  
  if (continent_code === 'EU') return 'EU';
  if (continent_code === 'AS') return 'APAC';
  return 'US';
}

const region = await getRegion();
const supabaseUrl = regions[region];
const supabase = createClient(supabaseUrl, anonKey);
```

**Data Replication:**
```sql
-- Create foreign data wrapper for replication
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER remote_us
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'us.supabase.co', dbname 'postgres', port '5432');

-- Import remote tables
IMPORT FOREIGN SCHEMA public
  LIMIT TO (tasks, groups)
  FROM SERVER remote_us
  INTO replica_us;
```

---

## Monitoring & Observability

### Key Metrics to Track

```javascript
class Metrics {
  // Latency
  averageResponseTime = 0;
  p95ResponseTime = 0;
  p99ResponseTime = 0;
  
  // Availability
  uptime = 0;
  errorRate = 0;
  
  // Throughput
  requestsPerSecond = 0;
  tasksCreatedPerHour = 0;
  
  // Resource Utilization
  cpuUsage = 0;
  memoryUsage = 0;
  databaseConnections = 0;
  
  // Cache Performance
  cacheHitRate = 0;
  cacheMissRate = 0;
}

// Implementation with monitoring library
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  tracesSampleRate: 0.1, // Sample 10% of transactions
});

// Automatic performance monitoring
Sentry.captureMessage("User completed task", "info", {
  tags: {
    component: "TaskBoard",
    action: "complete_task"
  },
  contexts: {
    task: {
      id: taskId,
      title: task.title,
      duration: completionTime
    }
  }
});
```

---

## Summary Table: Pattern Selection Guide

| Pattern | Use When | Avoid When |
|---------|----------|-----------|
| **Request-Reply** | Need immediate feedback | Can afford latency |
| **Pub-Sub** | Multiple consumers | Need guaranteed delivery |
| **Message Queue** | Must guarantee delivery | Need immediate response |
| **Strong Consistency** | Data integrity critical | Geographic distribution needed |
| **Eventual Consistency** | Scale needed more | Can't tolerate temporary inconsistency |
| **Circuit Breaker** | Cascading failures risk | Single service only |
| **Bulkhead** | Unpredictable load | Consistent load patterns |
| **Caching** | Read-heavy workloads | Data changes frequently |
| **Pagination** | Large datasets | Small result sets |
| **Batch Processing** | Deferred processing OK | Real-time required |

---

## Conclusion

These patterns work together to build resilient, scalable distributed systems. Choose patterns based on your specific requirements:

- **Consistency requirements** → Choose consistency pattern
- **Failure modes** → Choose fault tolerance pattern
- **Performance needs** → Choose performance pattern
- **Scale requirements** → Choose scalability pattern
- **Security requirements** → Choose security pattern
