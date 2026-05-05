# Distributed Systems Architecture: Task Management System

**Course-Aligned Comprehensive Documentation**

---

## Table of Contents
1. [Introduction](#introduction)
2. [Design Goals](#design-goals)
3. [Challenges & Pitfalls](#challenges--pitfalls)
4. [Types of Distributed Systems](#types-of-distributed-systems)
5. [Architectural Styles](#architectural-styles)
6. [System Architectures](#system-architectures)
7. [Real-World Examples](#real-world-examples)
8. [Implementation Analysis](#implementation-analysis)

---

## Introduction

### Definition of Distributed System

A **distributed system** is a collection of autonomous computers linked by a network, capable of communicating and coordinating their actions in order to appear to its users as a single coherent computing facility.

**In the context of our Task Management System (TaskFlow):**

TaskFlow is a **distributed web application** where:
- **Client nodes** (browsers/PWA instances) operate independently
- **Server nodes** (Supabase infrastructure) provide centralized services
- **Communication medium** is the internet (HTTP/HTTPS and WebSocket protocols)
- **Shared goal** is coordinated task management across multiple users and groups

### Characteristics of TaskFlow as a Distributed System

#### 1. **Autonomous Nodes**
```
┌─────────────────────────────────────────────────────────────┐
│ Multiple Independent Client Instances                        │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Browser 1    │ Browser 2    │ Mobile App   │ Desktop App    │
│ (User A)     │ (User B)     │ (User C)     │ (User D)       │
└─────────────────────────────────────────────────────────────┘
       ↓                ↓                ↓             ↓
┌─────────────────────────────────────────────────────────────┐
│ Single Coherent System (Supabase Backend)                   │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Auth Service │ REST API     │ Realtime     │ Database       │
│              │ (PostgREST)  │ (WebSocket)  │ (PostgreSQL)   │
└─────────────────────────────────────────────────────────────┘
```

- Each client node operates independently with local state management
- Clients can work offline (PWA offline-first capability)
- Supabase backend nodes coordinate state across all clients
- PostgreSQL database maintains authoritative state

#### 2. **Single Coherent System**
- Users experience one unified task management interface
- Data consistency via replication and synchronization
- Event-driven updates propagate to all connected clients
- Real-time collaboration appears seamless

#### 3. **Network Communication**
```
Client ←→ Network ←→ Server
   ↓                   ↓
- REST API calls      - Request handling
- WebSocket events    - Database operations
- Sync messages       - Event broadcasting
```

---

## Design Goals

### 1. Resource Sharing

**Definition:** Enable multiple clients to access and modify shared resources (tasks, groups, notifications) efficiently.

**Implementation in TaskFlow:**

| Resource | Sharing Method | Access Control |
|----------|---|---|
| Tasks | RESTful CRUD API | RLS (Row-Level Security) policies |
| Real-time updates | WebSocket events | JWT token validation |
| Offline data | Service Worker cache | Local storage isolation |
| User groups | Supabase profiles | Permission-based RLS |

**Code Example:**
```javascript
// Client-side resource access
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('group_id', currentGroupId)
  .order('created_at', { ascending: false });
```

```sql
-- Server-side resource protection
CREATE POLICY "Users can view tasks in their groups"
  ON tasks
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM group_members 
      WHERE group_id = tasks.group_id
    )
  );
```

### 2. Distribution Transparency

**Definition:** Hide the complexity of distribution from users and developers.

#### 2.1 **Access Transparency**
- Hide whether resources are local or remote
- **TaskFlow:** useRealtime hook abstracts Supabase API calls

```javascript
// Components don't know if data is local or remote
const { tasks, loading, error } = useRealtime('tasks');
```

#### 2.2 **Location Transparency**
- Hide actual location of resources
- **TaskFlow:** Resource URLs are abstracted by Supabase URLs

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const apiUrl = `${supabaseUrl}/rest/v1/tasks`;
// Actual server location is abstracted
```

#### 2.3 **Migration Transparency**
- Resources can be moved without affecting clients
- **TaskFlow:** Supabase cloud infrastructure handles data migration

#### 2.4 **Replication Transparency**
- Data replicated across multiple nodes transparently
- **TaskFlow:** Database replicas for high availability

```javascript
// Client doesn't know data is replicated
const response = await fetch(`${API_URL}/tasks`);
// Supabase handles replication behind the scenes
```

#### 2.5 **Concurrency Transparency**
- Multiple users can work simultaneously without conflict awareness
- **TaskFlow:** Conflict-free optimistic updates

```javascript
// Multiple users update tasks concurrently
const updateTask = async (taskId, updates) => {
  // Optimistic update (appears immediate)
  setLocalTask(taskId, updates);
  
  // Actual update sent to server
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
  
  // Handle conflicts if they occur
  if (error) revertLocalUpdate(taskId);
};
```

#### 2.6 **Failure Transparency**
- System continues operating despite partial failures
- **TaskFlow:** Offline sync and retry mechanisms

```javascript
// Service Worker handles offline scenarios
if (!navigator.onLine) {
  queueUpdate(task);
  return Promise.resolve(cachedData);
} else {
  return performUpdate(task);
}
```

### 3. Openness (Interoperability, Portability, Extensibility)

#### 3.1 **Interoperability**
- Different platforms communicate using standard protocols
- **TaskFlow:** Uses RESTful HTTP API (universal standard)

```javascript
// Can be called from any programming language/platform
fetch('https://supabase.com/rest/v1/tasks', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
```

#### 3.2 **Portability**
- System runs on different platforms without modification
- **TaskFlow:** PWA runs on web, mobile, and desktop

```
Platform Independence:
├─ Web (Chrome, Firefox, Safari, Edge)
├─ iOS (PWA installation)
├─ Android (PWA installation)
├─ macOS (PWA installation)
└─ Windows (PWA installation)
```

**vite.config.js:**
```javascript
const VitePWA = {
  registerType: 'autoUpdate',
  // Works across all platforms
  manifest: { name, icons, screenshots }
};
```

#### 3.3 **Extensibility**
- New services/features can be added without modifying existing code
- **TaskFlow:** Plugin-style architecture for new features

```
New Feature: Time Tracking
├─ New table: time_tracking
├─ New API: /time-tracking endpoints
├─ New component: TimeTracker.jsx
└─ New hook: useTimeTracking.js
// Existing code remains unchanged
```

### 4. Scalability

#### 4.1 **Size Scalability**
- System handles increasing numbers of users/data
- **TaskFlow Strategies:**
  - Database indexing on frequently queried columns
  - Query result pagination
  - Data caching with React Query

```javascript
// Pagination prevents loading entire dataset
const getTasks = async (page = 0, limit = 50) => {
  return await supabase
    .from('tasks')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1);
};
```

#### 4.2 **Geographical Scalability**
- System serves geographically distributed users
- **TaskFlow:** Supabase CDN distributes content

```
┌─────────────────────────────────────────────────┐
│ Global Users                                    │
├──────────────┬──────────────┬──────────────────┤
│ Europe       │ Asia         │ North America    │
└──────┬───────┴──────┬───────┴────────┬─────────┘
       │              │                │
       └──────────────┼────────────────┘
                      ↓
            ┌─────────────────────┐
            │ Supabase CDN Layer   │
            │ (Edge distribution) │
            └──────────┬──────────┘
                       ↓
            PostgreSQL (Single source of truth)
```

#### 4.3 **Administrative Scalability**
- Multiple administrators manage different aspects
- **TaskFlow:** Group-based admin roles

```sql
-- Admin roles per group
CREATE TABLE group_members (
  user_id UUID,
  group_id UUID,
  role ENUM('admin', 'member', 'viewer'),
  PRIMARY KEY (user_id, group_id)
);
```

---

## Challenges & Pitfalls

### 1. No Global Clock Problem

**Challenge:** Distributed systems cannot rely on perfectly synchronized clocks across nodes.

**Impact on TaskFlow:**
```
Client A (10:00:00.001) ─→ Update Task ─→ Server (10:00:00.050)
Client B (09:59:59.999) ─→ Update Task ─→ Server (10:00:00.051)

Which update happened first? We can't trust timestamps alone.
```

**Solutions Implemented:**

#### Lamport Timestamps (Logical Ordering)
```sql
-- Version-based ordering
ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1;

-- Each update increments version
UPDATE tasks 
SET version = version + 1, 
    updated_at = NOW()
WHERE id = task_id;
```

#### Event Sourcing
```javascript
// Store sequence of events rather than state
const taskEvents = [
  { id: 1, type: 'CREATED', timestamp: 1000, data: {...} },
  { id: 2, type: 'UPDATED', timestamp: 1001, data: {...} },
  { id: 3, type: 'ASSIGNED', timestamp: 1002, data: {...} }
];

// Reconstruct state by replaying events
const taskState = taskEvents.reduce((state, event) => {
  return applyEvent(state, event);
}, initialState);
```

#### Causal Ordering
```javascript
// Track causality in updates
class CausalUpdate {
  constructor(operation, vectorClock) {
    this.operation = operation;
    this.vectorClock = vectorClock; // [clientA: 5, clientB: 3, ...]
  }
}

// Don't apply update until dependencies are satisfied
const canApplyUpdate = (update, appliedUpdates) => {
  for (const [client, requiredVersion] of Object.entries(update.vectorClock)) {
    const appliedVersion = appliedUpdates[client] || 0;
    if (appliedVersion < requiredVersion) return false;
  }
  return true;
};
```

### 2. Replication Inconsistencies

**Challenge:** Multiple copies of data across nodes can become inconsistent.

**Scenarios in TaskFlow:**
```
Server Replica 1: Task status = "COMPLETED"
Server Replica 2: Task status = "IN_PROGRESS"
Client Cache:    Task status = "PENDING"

Which is correct?
```

**Solutions Implemented:**

#### Strong Consistency (via PostgreSQL)
```sql
-- Single source of truth
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  status VARCHAR,
  version INTEGER,
  updated_at TIMESTAMP
);

-- Pessimistic locking
BEGIN TRANSACTION;
  SELECT * FROM tasks WHERE id = ? FOR UPDATE;
  UPDATE tasks SET status = 'COMPLETED' WHERE id = ?;
COMMIT;
```

#### Eventual Consistency (via WebSocket)
```javascript
// Client receives authoritative updates
supabase.realtime.subscribe('tasks', (payload) => {
  // Broadcast update event
  if (payload.eventType === 'UPDATE') {
    updateLocalCache(payload.new);
  }
});
```

#### Conflict Resolution Strategy
```javascript
// Last-write-wins with timestamp validation
const mergeUpdates = (clientUpdate, serverUpdate) => {
  if (clientUpdate.timestamp > serverUpdate.timestamp) {
    return clientUpdate; // Client had more recent update
  } else {
    return serverUpdate; // Server is authoritative
  }
};
```

### 3. False Assumptions About Networks

#### 3.1 **"Network is Reliable"** - FALSE ✗

**Problems:**
- Packet loss (1-5% on typical networks)
- Connection drops
- Server downtime

**TaskFlow Solutions:**
```javascript
// Retry logic with exponential backoff
const retryWithBackoff = async (fn, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Offline-first PWA
const executeTask = async (task) => {
  try {
    return await supabase.rpc('execute_task', { task });
  } catch {
    // Queue for retry when online
    offlineSync.queue(task);
    return { cached: true };
  }
};
```

#### 3.2 **"Network Latency is Zero"** - FALSE ✗

**Problems:**
- Round-trip time: 50-500ms (even within same region)
- Intercontinental: 150ms+
- Users perceive delays as system being slow

**TaskFlow Solutions:**

**Optimistic UI Updates:**
```javascript
const updateTask = async (taskId, updates) => {
  // Update UI immediately (optimistic)
  setLocalTask(taskId, updates);
  
  // Sync with server asynchronously
  const result = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
  
  // Revert if server rejected
  if (result.error) {
    setLocalTask(taskId, originalValue);
  }
};
```

**Caching & Prefetching:**
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      cacheTime: 10 * 60 * 1000,
    },
  },
});
```

**Batch Operations:**
```javascript
// Instead of single request per update
const updateMultipleTasks = async (updates) => {
  const promises = updates.map(update => 
    supabase.from('tasks').update(update).eq('id', update.id)
  );
  return Promise.all(promises); // Parallel requests
};
```

#### 3.3 **"Bandwidth is Infinite"** - FALSE ✗

**Problems:**
- Mobile networks: 1-10 Mbps
- Satellite: limited data plans
- Every byte counts

**TaskFlow Solutions:**

**Data Compression:**
```javascript
// Only fetch needed fields
const getTasks = async () => {
  return await supabase
    .from('tasks')
    .select('id,title,status,due_date') // Not all fields
    .eq('group_id', groupId);
};
```

**Incremental Sync:**
```javascript
// Only sync changes, not entire dataset
const syncChanges = async (lastSyncTimestamp) => {
  return await supabase
    .from('tasks')
    .select('*')
    .gt('updated_at', lastSyncTimestamp);
};
```

**Code Splitting & Lazy Loading:**
```javascript
// vite.config.js
const manualChunks = {
  'react-vendor': ['react', 'react-dom'],
  'ui-vendor': ['lucide-react', '@dnd-kit/core'],
  // Load only what's needed
};
```

---

## Types of Distributed Systems

### 1. High-Performance Computing (HPC)

**Characteristics:**
- Massive computational power through parallelization
- Tightly coupled systems
- Dedicated networks
- Examples: Clusters, Grids, Cloud computing

**TaskFlow Relevance:** Limited direct application
- Cloud infrastructure (Supabase) uses HPC principles
- Batch processing could use distributed computing

**Example HPC Architecture:**
```
┌─────────────────────────────────────────┐
│ Task Parallelization                    │
├──────────────┬──────────────┬───────────┤
│ Worker 1     │ Worker 2     │ Worker 3  │
│ (4 cores)    │ (4 cores)    │ (4 cores) │
└──────────────┴──────────────┴───────────┘
        ↓              ↓              ↓
  Shared Memory or Network Interconnect
        ↓              ↓              ↓
┌─────────────────────────────────────────┐
│ Results Aggregation                     │
└─────────────────────────────────────────┘
```

**TaskFlow Use Case:**
```javascript
// Could use worker threads for report generation
const generateAnalyticsReport = async (tasks) => {
  const workers = Array(4).fill(null).map(() => new Worker('worker.js'));
  const chunks = chunkArray(tasks, tasks.length / 4);
  
  const results = await Promise.all(
    workers.map((w, i) => {
      return new Promise(resolve => {
        w.onmessage = (e) => resolve(e.data);
        w.postMessage(chunks[i]);
      });
    })
  );
  
  return aggregateResults(results);
};
```

### 2. Distributed Information Systems (DIS)

**Characteristics:**
- Focus on data integration and sharing
- Heterogeneous databases
- Document-based or relational
- Examples: Databases, Web applications, Intranets

**TaskFlow Alignment:** ✓ CORE EXAMPLE

**Architecture:**
```
┌────────────────────────────────────────────┐
│ Multiple Data Sources                      │
├──────────────┬──────────────┬──────────────┤
│ PostgreSQL   │ Cache        │ File Storage │
│ (Tasks)      │ (Redis)      │ (Attachments)|
└──────────────┴──────────────┴──────────────┘
        ↓              ↓              ↓
┌────────────────────────────────────────────┐
│ Middleware (Supabase PostgREST API)        │
├─────────────────────────────────────────────┤
│ - Query translation                        │
│ - Authentication & Authorization           │
│ - Transaction management                   │
└────────────────────────────────────────────┘
        ↓              ↓              ↓
┌────────────────────────────────────────────┐
│ Web Applications / Clients                  │
├──────────────┬──────────────┬──────────────┤
│ React Web    │ Mobile App   │ Third-party  │
└──────────────┴──────────────┴──────────────┘
```

**TaskFlow Implementation:**
```javascript
// Unified interface to heterogeneous data
const getTaskWithDetails = async (taskId) => {
  // Combines data from multiple sources
  const task = await supabase.from('tasks').select('*').eq('id', taskId);
  const comments = await supabase.from('comments').select('*').eq('task_id', taskId);
  const timeEntries = await supabase.from('time_tracking').select('*').eq('task_id', taskId);
  
  return { ...task, comments, timeEntries };
};
```

### 3. Pervasive Systems (Ubiquitous Computing)

**Characteristics:**
- Embedded in physical environment
- Mobile/wireless
- Resource-constrained
- Examples: Sensor networks, IoT, mobile apps

**TaskFlow Relevance:** Moderate application

**Mobile-First Approach:**
```javascript
// Service Worker for offline capability
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('taskflow-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.css',
        '/app.js'
      ]);
    })
  );
});

// Use cached data when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**PWA Manifest (pervasive system capability):**
```json
{
  "name": "TaskFlow",
  "short_name": "Tasks",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "orientation": "portrait-primary"
}
```

---

## Architectural Styles

### 1. Layered Architecture

**Definition:** Organize system into logical layers with specific responsibilities.

**TaskFlow Implementation:**

```
┌─────────────────────────────────────────────────┐
│ Presentation Layer                              │
│ ┌───────────────────────────────────────────┐   │
│ │ React Components (UI)                     │   │
│ │ - TaskBoard.jsx                           │   │
│ │ - GroupSettings.jsx                       │   │
│ │ - Analytics.jsx                           │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓ ↑
┌─────────────────────────────────────────────────┐
│ Business Logic / Application Layer              │
│ ┌───────────────────────────────────────────┐   │
│ │ Custom Hooks (State Management)           │   │
│ │ - useTasks.js                             │   │
│ │ - useGroups.js                            │   │
│ │ - useAuth.jsx                             │   │
│ │ - useOfflineSync.js                       │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓ ↑
┌─────────────────────────────────────────────────┐
│ Data Access / API Layer                         │
│ ┌───────────────────────────────────────────┐   │
│ │ Supabase Client & Services                │   │
│ │ - supabase.js (client initialization)     │   │
│ │ - services/api/* (API calls)              │   │
│ │ - offlineSync.js (offline persistence)    │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓ ↑
┌─────────────────────────────────────────────────┐
│ Database / Data Persistence Layer               │
│ ┌───────────────────────────────────────────┐   │
│ │ PostgreSQL Database                       │   │
│ │ - tables: tasks, groups, users, etc.      │   │
│ │ - Indexes, constraints, triggers          │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Clear separation of concerns
- Easy to test each layer independently
- Changes in one layer don't affect others

**Code Example:**
```javascript
// Presentation Layer
function TaskBoard() {
  const { tasks, updateTask } = useTasks(); // Business Logic
  return <div>{tasks.map(task => <TaskCard key={task.id} task={task} />)}</div>;
}

// Application Layer (Custom Hook)
function useTasks() {
  const [tasks, setTasks] = useState([]);
  const supabase = useSupabaseClient();
  
  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*'); // API Layer
    setTasks(data);
  }, [supabase]);
  
  useEffect(() => { fetchTasks(); }, []);
  
  return { tasks, updateTask: /* ... */ };
}

// Data Access Layer
async function updateTask(taskId, updates) {
  return await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
}
```

### 2. Object-Based Architecture

**Definition:** Components communicate through well-defined interfaces; encapsulation and polymorphism.

**TaskFlow Approach:**

```javascript
// Base object model
class Task {
  constructor(id, title, description) {
    this.id = id;
    this.title = title;
    this.description = description;
  }
  
  async update(updates) {
    // Encapsulated update logic
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', this.id);
    
    if (!error) Object.assign(this, updates);
    return data;
  }
  
  async delete() {
    // Encapsulated delete logic
    return await supabase
      .from('tasks')
      .delete()
      .eq('id', this.id);
  }
}

// Polymorphic objects with different behaviors
class StandardTask extends Task {
  calculateDuration() {
    return 'standard duration calculation';
  }
}

class RecurringTask extends Task {
  calculateDuration() {
    return 'recurring duration calculation';
  }
  
  generateNextOccurrence() {
    // Generate next recurring instance
  }
}

// Client code works with interface, not concrete types
async function processTask(task) {
  const duration = task.calculateDuration(); // Works for any task type
  await task.update({ duration });
}
```

**Proxy Pattern (Remote Objects):**
```javascript
// Local proxy for remote task
class TaskProxy {
  constructor(taskId, supabaseClient) {
    this.taskId = taskId;
    this.supabase = supabaseClient;
    this._cache = null;
  }
  
  async getTask() {
    if (!this._cache) {
      const { data } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('id', this.taskId);
      this._cache = data[0];
    }
    return this._cache;
  }
  
  async updateTask(updates) {
    const result = await this.supabase
      .from('tasks')
      .update(updates)
      .eq('id', this.taskId);
    this._cache = null; // Invalidate cache
    return result;
  }
}

// Usage - client doesn't know it's remote
const task = new TaskProxy(taskId, supabase);
const taskData = await task.getTask();
```

### 3. Service-Oriented / RESTful Architecture

**Definition:** System comprises services exposing functionality via well-defined APIs; resources are primary abstraction.

**TaskFlow REST API Structure:**

```
Service 1: Task Service
  GET    /tasks              - List all tasks
  GET    /tasks/:id          - Get specific task
  POST   /tasks              - Create new task
  PATCH  /tasks/:id          - Update task
  DELETE /tasks/:id          - Delete task

Service 2: Group Service
  GET    /groups             - List user's groups
  GET    /groups/:id         - Get group details
  POST   /groups             - Create group
  PATCH  /groups/:id         - Update group
  DELETE /groups/:id         - Delete group

Service 3: Notification Service
  GET    /notifications      - List notifications
  PATCH  /notifications/:id  - Mark as read
  DELETE /notifications/:id  - Delete notification

Service 4: Authentication Service
  POST   /auth/signup        - Register user
  POST   /auth/login         - Login
  POST   /auth/logout        - Logout
  GET    /auth/user          - Get current user
```

**Implementation:**
```javascript
// RESTful task service
async function getTasks(filters = {}) {
  let query = supabase.from('tasks').select('*');
  
  if (filters.groupId) {
    query = query.eq('group_id', filters.groupId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.assignee) {
    query = query.eq('assigned_to', filters.assignee);
  }
  
  const { data, error } = await query;
  return { data, error };
}

async function createTask(taskData) {
  return await supabase.from('tasks').insert([{
    title: taskData.title,
    description: taskData.description,
    group_id: taskData.groupId,
    status: 'TODO',
    created_at: new Date().toISOString()
  }]);
}

async function updateTask(taskId, updates) {
  return await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);
}

async function deleteTask(taskId) {
  return await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
}
```

**HATEOAS (Hypermedia As The Engine Of Application State):**
```javascript
// Response includes links to related resources
const taskResponse = {
  id: '123',
  title: 'Fix bug',
  status: 'IN_PROGRESS',
  _links: {
    self: { href: '/tasks/123' },
    comments: { href: '/tasks/123/comments' },
    assignee: { href: '/users/456' },
    group: { href: '/groups/789' }
  }
};
```

### 4. Publish-Subscribe (Event-Driven) Architecture

**Definition:** Components communicate through events; decoupled publishers and subscribers.

**TaskFlow Event System:**

```
┌──────────────────────────────────────────────┐
│ Event Producers (Publishers)                  │
├────────────────┬────────────────┬────────────┤
│ Task Updates   │ User Actions   │ System     │
│ - Create       │ - Login        │ Events     │
│ - Update       │ - Assignment   │ - Sync     │
│ - Delete       │ - Comment      │ - Offline  │
└────────────────┴────────────────┴────────────┘
        ↓                ↓                ↓
┌──────────────────────────────────────────────┐
│ Event Bus (Supabase Realtime / Event Emitter)│
└──────────────────────────────────────────────┘
        ↓                ↓                ↓
┌──────────────────────────────────────────────┐
│ Event Consumers (Subscribers)                 │
├────────────────┬────────────────┬────────────┤
│ UI Updates     │ Notifications  │ Analytics  │
│ - Refresh      │ - Mention      │ - Logging  │
│ - Sync         │ - Assignment   │ - Metrics  │
│ - Offline Queue│ - Mention      │ - Tracking │
└────────────────┴────────────────┴────────────┘
```

**Implementation:**

```javascript
// Event emitter pattern
class EventBus extends EventEmitter {
  // Event types
  static EVENTS = {
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    USER_ASSIGNED: 'user:assigned',
    COMMENT_ADDED: 'comment:added',
    USER_LOGGED_IN: 'user:logged_in',
    OFFLINE_SYNC_START: 'offline:sync:start',
    OFFLINE_SYNC_END: 'offline:sync:end'
  };
}

const eventBus = new EventBus();

// Publisher: Task service
async function createTask(taskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData]);
  
  if (!error) {
    eventBus.emit(EventBus.EVENTS.TASK_CREATED, data[0]);
  }
  return { data, error };
}

// Subscriber 1: Update UI
eventBus.on(EventBus.EVENTS.TASK_CREATED, (task) => {
  addTaskToBoard(task);
  showSuccessNotification(`Task "${task.title}" created`);
});

// Subscriber 2: Send notification
eventBus.on(EventBus.EVENTS.TASK_CREATED, async (task) => {
  if (task.assigned_to) {
    await sendNotification(task.assigned_to, {
      type: 'TASK_ASSIGNED',
      message: `You were assigned: ${task.title}`
    });
  }
});

// Subscriber 3: Track analytics
eventBus.on(EventBus.EVENTS.TASK_CREATED, (task) => {
  analytics.track('task_created', {
    taskId: task.id,
    userId: task.created_by,
    timestamp: new Date()
  });
});
```

**Realtime Publish-Subscribe (WebSocket):**
```javascript
// Subscribe to real-time task changes
const subscription = supabase
  .from('tasks')
  .on('*', payload => {
    console.log('Change received!', payload);
    
    if (payload.eventType === 'INSERT') {
      eventBus.emit(EventBus.EVENTS.TASK_CREATED, payload.new);
    } else if (payload.eventType === 'UPDATE') {
      eventBus.emit(EventBus.EVENTS.TASK_UPDATED, payload.new);
    } else if (payload.eventType === 'DELETE') {
      eventBus.emit(EventBus.EVENTS.TASK_DELETED, payload.old);
    }
  })
  .subscribe();
```

### 5. Middleware Architecture

**Definition:** Software layer that handles communication and coordination between components.

**TaskFlow Middleware Stack:**

```
┌────────────────────────────────────────────────────┐
│ Application Layer (React Components)               │
└────────────────────────────────────────────────────┘
                         ↓ ↑
┌────────────────────────────────────────────────────┐
│ Middleware Layer 1: Request/Response Interceptors  │
│ - Add authentication headers                        │
│ - Add request ID for tracing                       │
│ - Compress/decompress responses                    │
└────────────────────────────────────────────────────┘
                         ↓ ↑
┌────────────────────────────────────────────────────┐
│ Middleware Layer 2: Caching                        │
│ - React Query handles caching                      │
│ - Service Worker handles HTTP caching              │
│ - IndexedDB for offline persistence               │
└────────────────────────────────────────────────────┘
                         ↓ ↑
┌────────────────────────────────────────────────────┐
│ Middleware Layer 3: Logging & Monitoring           │
│ - Request/response logging                        │
│ - Error tracking                                   │
│ - Performance metrics                             │
└────────────────────────────────────────────────────┘
                         ↓ ↑
┌────────────────────────────────────────────────────┐
│ Middleware Layer 4: Synchronization                │
│ - Offline sync queue management                    │
│ - Conflict resolution                             │
│ - Data reconciliation                             │
└────────────────────────────────────────────────────┘
                         ↓ ↑
┌────────────────────────────────────────────────────┐
│ API Client (Supabase)                              │
└────────────────────────────────────────────────────┘
```

**Implementation:**

```javascript
// Custom middleware for request/response handling
class MiddlewareChain {
  constructor() {
    this.middlewares = [];
  }
  
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  async execute(request) {
    let response = request;
    for (const middleware of this.middlewares) {
      response = await middleware(response);
    }
    return response;
  }
}

// Create middleware chain
const middlewareChain = new MiddlewareChain();

// Middleware 1: Add authentication
middlewareChain.use(async (request) => {
  const token = await getAuthToken();
  return {
    ...request,
    headers: { ...request.headers, Authorization: `Bearer ${token}` }
  };
});

// Middleware 2: Add request ID for tracing
middlewareChain.use(async (request) => {
  return {
    ...request,
    id: generateRequestId(),
    timestamp: new Date().toISOString()
  };
});

// Middleware 3: Logging
middlewareChain.use(async (request) => {
  console.log(`[${request.timestamp}] ${request.method} ${request.url}`);
  const response = await fetch(request);
  console.log(`[${request.timestamp}] ${response.status}`);
  return response;
});

// Middleware 4: Error handling
middlewareChain.use(async (request) => {
  try {
    return await fetch(request);
  } catch (error) {
    logger.error('Request failed', { request, error });
    if (!navigator.onLine) {
      return offlineSync.queueRequest(request);
    }
    throw error;
  }
});
```

---

## System Architectures

### 1. Centralized Architecture (Client-Server)

**Characteristics:**
- Single server handles all operations
- Clients depend on server
- Simple to implement but single point of failure

**TaskFlow Model:**

```
┌─────────────────────────────────────────────┐
│ Clients (Multiple Instances)                │
├──────────────┬──────────────┬───────────────┤
│ Browser A    │ Browser B    │ Mobile App    │
│ (User A)     │ (User B)     │ (User C)      │
└──────────────┴──────────────┴───────────────┘
        ↓              ↓              ↓
        ←─────────────────────────────→
        HTTP/HTTPS + WebSocket
        ←─────────────────────────────→
        ↓              ↓              ↓
┌─────────────────────────────────────────────┐
│ Central Server (Supabase)                   │
├──────────────┬──────────────┬───────────────┤
│ Auth Service │ REST API     │ Realtime      │
│              │ (PostgREST)  │ (WebSocket)   │
└──────────────┴──────────────┴───────────────┘
        ↓              ↓              ↓
┌─────────────────────────────────────────────┐
│ PostgreSQL Database (Single Source of Truth)│
└─────────────────────────────────────────────┘
```

**Advantages:**
```
✓ Simple to implement
✓ Data consistency (single source of truth)
✓ Easy to monitor and maintain
✓ Centralized security policies
✓ Transactional integrity
```

**Disadvantages:**
```
✗ Single point of failure
✗ Server bottleneck at scale
✗ Network latency affects all operations
✗ Depends on server availability
```

**Fault Tolerance Strategies:**
```javascript
// Connection pooling and retries
const maxRetries = 3;
const retryDelay = 1000;

async function queryWithRetry(query, attempt = 0) {
  try {
    return await supabase.from(query.table).select(query.fields);
  } catch (error) {
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
      return queryWithRetry(query, attempt + 1);
    }
    throw error;
  }
}

// Fallback to cached data
async function getTasksSafely(groupId) {
  try {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('group_id', groupId);
    cacheTasks(data);
    return data;
  } catch (error) {
    const cachedData = getCachedTasks(groupId);
    if (cachedData) return cachedData;
    throw new Error('Server unavailable and no cached data');
  }
}
```

### 2. Decentralized Architecture (Peer-to-Peer)

**Characteristics:**
- No central server
- Nodes are equal peers
- Data replicated across network
- More resilient but more complex

**TaskFlow P2P Alternative (Not currently implemented):**

```
┌─────────────────────────────────────────────┐
│ Peer 1 (Browser A)  ←→ Peer 2 (Browser B)   │
│ - Local cache       ←→ - Local cache        │
│ - Task data         ←→ - Task data          │
└─────────────────────────────────────────────┘
        ↓                      ↓
        ←──────── Sync ────────→
        ↓                      ↓
┌─────────────────────────────────────────────┐
│ Peer 3 (Mobile)     ←→ Peer 4 (Desktop)     │
│ - Local cache       ←→ - Local cache        │
│ - Task data         ←→ - Task data          │
└─────────────────────────────────────────────┘
```

**P2P Implementation Concepts:**
```javascript
// WebRTC for direct peer-to-peer communication
class P2PTaskSync {
  constructor() {
    this.peers = new Map();
    this.peerConnection = null;
    this.dataChannel = null;
  }
  
  async connectToPeer(peerId) {
    this.peerConnection = new RTCPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel('tasks');
    
    this.dataChannel.onmessage = (event) => {
      const syncMessage = JSON.parse(event.data);
      this.handleSyncMessage(syncMessage);
    };
    
    // Exchange ICE candidates and SDP
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
  }
  
  broadcastTaskChange(task) {
    const message = JSON.stringify({
      type: 'TASK_UPDATE',
      task: task,
      timestamp: Date.now(),
      peerId: this.myPeerId
    });
    
    this.peers.forEach(dataChannel => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(message);
      }
    });
  }
  
  handleSyncMessage(message) {
    // Apply changes from other peers
    // Handle conflicts using CRDT or vector clocks
  }
}

// CRDT (Conflict-Free Replicated Data Type) for P2P
class CRDTTask {
  constructor(id, title, version = {}) {
    this.id = id;
    this.title = title;
    this.version = version; // Vector clock: { peer1: 5, peer2: 3, ... }
  }
  
  // Merge two task versions
  static merge(task1, task2) {
    const merged = task1.version > task2.version ? task1 : task2;
    return merged;
  }
}
```

**Use Cases:**
- Offline-first applications
- Mesh networks
- Resilient systems without infrastructure

### 3. Hybrid Architecture (Edge + Central)

**Characteristics:**
- Combines centralized and decentralized approaches
- Edge servers closer to users
- Central server for coordination
- Best of both worlds

**TaskFlow Hybrid Architecture:**

```
┌────────────────────────────────────────────────┐
│ Central Supabase Instance                      │
│ (PostgreSQL, Auth, Coordination)               │
└─────────────┬─────────────────────────┬────────┘
              ↓                         ↓
      ┌───────────────┐         ┌───────────────┐
      │ Edge Server   │         │ Edge Server   │
      │ (Region: EU)  │         │ (Region: US)  │
      │ - Cache       │         │ - Cache       │
      │ - Local sync  │         │ - Local sync  │
      └───┬───────────┘         └────┬──────────┘
          ↓ ↑                        ↓ ↑
      ┌─────────┐              ┌─────────┐
      │ Client 1│              │ Client 3│
      │ Client 2│              │ Client 4│
      └─────────┘              └─────────┘
```

**Implementation:**

```javascript
// Detect user's region and route to nearest edge server
const getRegionalEndpoint = async () => {
  const userRegion = await detectUserRegion(); // GeoIP lookup
  
  const endpoints = {
    'EU': 'https://eu.supabase.com',
    'US': 'https://us.supabase.com',
    'APAC': 'https://apac.supabase.com'
  };
  
  return endpoints[userRegion] || endpoints['US'];
};

// Cache at edge for faster access
const getCachedOrFetch = async (key, fetchFn) => {
  const cached = await edgeCache.get(key);
  if (cached) return cached;
  
  const data = await fetchFn();
  await edgeCache.set(key, data, { ttl: 3600 }); // 1 hour
  return data;
};

// Periodic sync between edge and central
setInterval(async () => {
  const localChanges = await offlineSync.getQueue();
  await supabase.rpc('sync_edge_changes', { changes: localChanges });
}, 30000); // Every 30 seconds
```

---

## Real-World Examples

### 1. Cloud Services (Amazon S3, Azure, Google App Engine)

**Characteristics:**
- On-demand resource provisioning
- Pay-as-you-go model
- Global distribution
- Managed services

**TaskFlow in Cloud:**

**Supabase Cloud Architecture (PostgreSQL as a Service):**
```
┌─────────────────────────────────────┐
│ Supabase Cloud (Managed Service)    │
├─────────────────────────────────────┤
│ ✓ Automatic backups                 │
│ ✓ Geo-replication (High Availability)│
│ ✓ Horizontal scaling                │
│ ✓ DDoS protection                   │
│ ✓ SSL/TLS encryption                │
│ ✓ Database monitoring               │
│ ✓ Real-time subscriptions           │
└─────────────────────────────────────┘
```

**File Storage (like S3):**
```javascript
// Upload task attachments to cloud storage
async function uploadTaskAttachment(taskId, file) {
  const fileName = `tasks/${taskId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (!error) {
    // Save reference in database
    await supabase.from('attachments').insert({
      task_id: taskId,
      file_name: file.name,
      storage_path: data.path,
      file_size: file.size,
      uploaded_at: new Date().toISOString()
    });
  }
}
```

### 2. P2P Applications (Skype, BitTorrent, Spotify)

**Characteristics:**
- Direct peer communication
- Distributed data
- Resilient to failures
- Resource sharing among peers

**TaskFlow P2P Use Case: Offline Collaboration**

```javascript
// BitTorrent-like task synchronization
class TaskSyncTorrent {
  constructor() {
    this.peers = new Set();
    this.taskPieces = new Map(); // Tasks broken into pieces
  }
  
  // Break task into pieces like BitTorrent
  createTaskPieces(task) {
    const pieces = {
      [task.id + '-metadata']: { title: task.title, description: task.description },
      [task.id + '-status']: { status: task.status, updated_at: task.updated_at },
      [task.id + '-assignment']: { assigned_to: task.assigned_to }
    };
    return pieces;
  }
  
  // Request missing pieces from peers
  async getPiecesFromPeers(missingPieces) {
    const results = await Promise.race(
      Array.from(this.peers).map(peer =>
        peer.request(missingPieces)
      )
    );
    return results;
  }
  
  // Share pieces you have with other peers
  broadcastPieces(taskId) {
    const pieces = this.taskPieces.get(taskId);
    this.peers.forEach(peer => {
      peer.receivePieces(pieces);
    });
  }
}
```

**Spotify-like Distributed Caching:**
```javascript
// Cache frequently accessed data at edge locations
class DistributedCache {
  constructor() {
    this.caches = new Map(); // { region -> cache }
    this.replicationFactor = 3; // Replicate to 3 regions
  }
  
  async set(key, value) {
    const targets = this.selectTargetRegions(key, this.replicationFactor);
    
    await Promise.all(
      targets.map(region =>
        this.caches.get(region).set(key, value)
      )
    );
  }
  
  async get(key) {
    // Try nearest region first
    const nearestRegion = this.getNearestRegion();
    try {
      return await this.caches.get(nearestRegion).get(key);
    } catch {
      // Fallback to other regions
      for (const cache of this.caches.values()) {
        try {
          const value = await cache.get(key);
          // Replicate to nearest for future access
          await this.caches.get(nearestRegion).set(key, value);
          return value;
        } catch {
          continue;
        }
      }
    }
  }
}
```

---

## Implementation Analysis

### TaskFlow Distributed System Assessment

#### Consistency Model
```
Consistency Level: STRONG (within acceptable latency)
- Single PostgreSQL instance as source of truth
- Transactions ensure ACID properties
- WebSocket provides near-real-time consistency
- Optimistic updates with conflict resolution
```

#### Fault Tolerance
```
Availability: High (Supabase infrastructure)
- Automatic backups
- Read replicas for failover
- Connection pooling and retries
- Offline mode with sync queue
- Graceful degradation
```

#### Scalability
```
Horizontal: Yes (PostgreSQL with replication)
Vertical: Yes (Supabase Pro/Enterprise plans)
Geographic: Partial (edge functions planned)
```

#### Security
```
Authentication: JWT tokens via Supabase Auth
Authorization: RLS (Row-Level Security) policies
Transport: HTTPS + WSS encryption
Storage: Encrypted at rest (Supabase Enterprise)
```

### Recommendations for Production

```javascript
// 1. Implement circuit breaker pattern
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
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
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => { this.state = 'HALF_OPEN'; }, this.timeout);
    }
  }
}

// 2. Implement bulkhead pattern
class Bulkhead {
  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }
  
  async execute(fn) {
    if (this.running >= this.maxConcurrent) {
      return new Promise(resolve => {
        this.queue.push({ fn, resolve });
      });
    }
    
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const { fn, resolve } = this.queue.shift();
        resolve(this.execute(fn));
      }
    }
  }
}

// 3. Implement timeout pattern
async function executeWithTimeout(promise, timeoutMs = 5000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## Conclusion

TaskFlow demonstrates key distributed systems concepts:

1. **Multi-tier architecture** with clear separation of concerns
2. **Scalable design** supporting geographic distribution
3. **Resilience patterns** including offline-first and retry logic
4. **Strong consistency** through centralized database with eventual consistency for caches
5. **Security through isolation** via JWT and RLS policies
6. **RESTful APIs** enabling interoperability across platforms

This architecture aligns with industry best practices for modern web applications while maintaining the flexibility to evolve toward more decentralized or edge-based approaches as requirements change.
