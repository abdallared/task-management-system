# Distributed Systems: Quick Reference Guide

**TaskFlow Implementation Summary**

---

## Core Concepts at a Glance

### What is a Distributed System?

```
┌─────────────────────────────────────────────────┐
│ Definition: Multiple independent computers      │
│ connected by a network, working together as     │
│ if they were a single system                    │
└─────────────────────────────────────────────────┘

Key Properties:
✓ Autonomous nodes (independent operation)
✓ Network communication (async, unreliable)
✓ Single coherent system (unified interface)
✓ No global clock (synchronization challenges)
✓ Partial failures (some parts fail, not all)
```

### TaskFlow as a Distributed System

```
                    Users/Devices
                    (Autonomous)
                    ↓ ↑ ↓ ↑ ↓ ↑
    Network (unreliable, delayed, unordered)
                    ↓ ↑ ↓ ↑ ↓ ↑
              Supabase (Central Server)
                (Coordinates state)
                    ↓
              PostgreSQL Database
           (Single source of truth)
```

---

## Design Goals Checklist

| Goal | TaskFlow Implementation | Evidence |
|------|------------------------|----------|
| **Resource Sharing** | JWT auth + RLS policies | All users access same tasks, protected by security |
| **Distribution Transparency** | Supabase client abstracts API | Components don't know if data is local/remote |
| **Access Transparency** | useRealtime hook | Same interface for cached/live data |
| **Location Transparency** | Supabase URL abstraction | Server location irrelevant to code |
| **Migration Transparency** | Cloud provider handles | Data moves without app changes |
| **Replication Transparency** | PostgreSQL replicas | Clients unaware of redundancy |
| **Concurrency Transparency** | Optimistic updates + conflicts | Multiple users edit without seeing conflicts |
| **Failure Transparency** | Offline cache + sync queue | App continues without server |
| **Openness** | REST API (standard) | Any language can call endpoints |
| **Scalability (Size)** | Pagination + indexes | Grows with users/tasks |
| **Scalability (Geography)** | Supabase CDN | Users worldwide supported |
| **Scalability (Admin)** | Group-based roles | Multiple admins per group |

---

## Common Challenges & Solutions

### Challenge 1: No Global Clock ⏰

**Problem:** Can't use timestamps alone to order events.

```
Client A: Update task @ 10:00:00.001
Client B: Update task @ 10:00:00.000 (slightly ahead!)

Which update happened first? Can't trust system clocks.
```

**Solutions in TaskFlow:**

| Solution | How It Works | Example |
|----------|-------------|---------|
| **Version Numbers** | Increment on each update | Task version 1 → 2 → 3 |
| **Event Sequence** | Track order of operations | Event#1, Event#2, Event#3 |
| **Vector Clocks** | Track per-client timestamps | [client1:5, client2:3] |
| **Causality** | Track what caused what | Comment depends on task creation |

**Code:**
```javascript
// Use version-based ordering
const update = {
  id: 'task-123',
  version: 5, // More reliable than timestamp
  status: 'COMPLETED'
};
```

---

### Challenge 2: Replication Inconsistency 🔄

**Problem:** Multiple copies of data diverge.

```
Replica 1 (EU):   Task status = COMPLETED
Replica 2 (US):   Task status = IN_PROGRESS
Replica 3 (APAC): Task status = PENDING

Which is correct? 😕
```

**Solutions in TaskFlow:**

| Strategy | When to Use | Example |
|----------|------------|---------|
| **Strong** | Data integrity critical | Bank transfers, financial data |
| **Eventual** | Can tolerate delay | Social media likes, comments |
| **Causal** | Order matters | Comment threads, task dependencies |

**Code:**
```javascript
// Strong consistency: Wait for server confirmation
const task = await supabase
  .from('tasks')
  .update({ status: 'COMPLETED' })
  .eq('id', taskId);
// Server atomically updates all replicas

// Eventual consistency: Update optimistically
setTaskLocal({ status: 'COMPLETED' }); // Immediate
supabase.update(...); // Later sync
```

---

### Challenge 3: False Assumptions About Networks 🌐

#### Assumption 1: "Network is reliable"

**Reality:** 1-5% packet loss, disconnections, timeouts

**TaskFlow Solution:** Retry logic + offline mode

```javascript
// Retry failed requests
await retryWithBackoff(() => supabase.from('tasks').select('*'));

// Cache data for offline access
const cachedTasks = await localCache.get('tasks');
if (!navigator.onLine && cachedTasks) {
  return cachedTasks; // Use cached data
}
```

#### Assumption 2: "Network latency is zero"

**Reality:** 50-500ms for requests (even closer servers)

**TaskFlow Solution:** Optimistic updates

```javascript
// Update UI immediately, sync later
updateUIOptimistically(task);
await supabase.update(task).then(
  success => confirmUpdate(task),
  error => revertUpdate(task)
);
```

#### Assumption 3: "Bandwidth is infinite"

**Reality:** Mobile: 1-10 Mbps, Limited data plans

**TaskFlow Solution:** Fetch only needed fields + compress

```javascript
// Query only needed fields
const { data } = await supabase
  .from('tasks')
  .select('id,title,status'); // Not all 20 fields

// Incremental sync (only changes)
const changes = await supabase
  .from('tasks')
  .select('*')
  .gt('updated_at', lastSync);
```

---

## Architecture Styles

### 1. Layered Architecture (TaskFlow Structure)

```
┌─────────────────────────────┐
│ UI Components (React)        │ ← What users see
├─────────────────────────────┤
│ Custom Hooks (useTasks)      │ ← Business logic
├─────────────────────────────┤
│ Services (API calls)         │ ← Data access
├─────────────────────────────┤
│ Database (PostgreSQL)        │ ← Persistent storage
└─────────────────────────────┘
```

**Benefits:** Testable, maintainable, clear separation
**Tradeoff:** More layers = more latency

### 2. Service-Oriented (REST API)

```
GET    /tasks              ← Retrieve
POST   /tasks              ← Create
PATCH  /tasks/:id          ← Update
DELETE /tasks/:id          ← Delete
```

**Benefits:** Standard, language-agnostic, scalable
**Tradeoff:** More network calls needed

### 3. Event-Driven (Pub-Sub)

```
Publisher: Task updated
    ↓
Event Bus
    ↓
Subscribers: [UI, Notifications, Analytics]
```

**Benefits:** Loose coupling, scalable
**Tradeoff:** Eventual consistency, harder to debug

### 4. Middleware (Interceptors)

```
Request → [Auth] → [Cache] → [Logging] → Server
Response ← [Auth] ← [Cache] ← [Logging] ← Server
```

**Benefits:** Cross-cutting concerns, reusable
**Tradeoff:** More complex flow

---

## System Architectures

### Centralized (Client-Server)

**TaskFlow Model:**
```
Clients → (HTTPS/WebSocket) → Supabase Server → PostgreSQL
```

| Pros | Cons |
|------|------|
| ✓ Simple | ✗ Single point of failure |
| ✓ Data consistency | ✗ Server bottleneck |
| ✓ Centralized security | ✗ Network dependency |

### Decentralized (Peer-to-Peer)

**Alternative (Not Used):**
```
Client 1 ↔ Client 2 ↔ Client 3 ↔ Client 4
(All equal, no server)
```

| Pros | Cons |
|------|------|
| ✓ No single point of failure | ✗ Very complex |
| ✓ Offline capable | ✗ Consistency hard |
| ✓ Scalable | ✗ Security difficult |

### Hybrid (Edge + Central)

**Possible Future:**
```
Edge Servers (close to users)
    ↕
Central Server (authoritative)
```

| Pros | Cons |
|------|------|
| ✓ Low latency | ✗ More infrastructure |
| ✓ Fault tolerant | ✗ Replication complexity |
| ✓ Scalable | ✗ Consistency harder |

---

## Consistency Models

### Strong Consistency

```
Write ← Propagate to all replicas → All see new value
```

**When:** Bank account balance, inventory count
**Cost:** Slower (wait for all replicas)

### Eventual Consistency

```
Write → Some see new value → Eventually all see new value
```

**When:** Social media likes, comments
**Cost:** Temporary inconsistency

### Causal Consistency

```
A causes B → All see A before B
(Other unrelated events can be out of order)
```

**When:** Comment threads, task dependencies
**Cost:** Medium complexity

### Comparison

| Model | Latency | Consistency | Examples |
|-------|---------|-------------|----------|
| **Strong** | High | Always same | Banking |
| **Eventual** | Low | Eventually same | Social media |
| **Causal** | Medium | Order preserved | Comments |

**TaskFlow Uses: STRONG (acceptable latency + high consistency)**

---

## Common Patterns

### Communication Patterns

| Pattern | Sync/Async | 1-to-1 or 1-to-N | Example |
|---------|-----------|------------------|---------|
| **Request-Reply** | Sync | 1-to-1 | `GET /tasks` |
| **Pub-Sub** | Async | 1-to-N | Real-time updates |
| **Message Queue** | Async | 1-to-N | Email notifications |

### Fault Tolerance

```javascript
// Pattern: Retry
try { } catch { setTimeout(() => retry(), 1000); }

// Pattern: Circuit Breaker
if (failures > 5) { state = 'OPEN'; /* fail fast */ }

// Pattern: Bulkhead
if (running < max) { execute(); } else { queue(); }

// Pattern: Timeout
Promise.race([operation(), timeout(5000)]);
```

### Performance

```javascript
// Caching: Store frequently accessed data
if (cache.has(key)) return cache.get(key);

// Pagination: Load data in chunks
const page1 = await fetch(`/tasks?page=1&limit=50`);

// Batch: Group operations
const updates = [task1, task2, task3];
await batchUpdate(updates);
```

---

## Quick Decision Trees

### Which Consistency Model?

```
Do you NEED immediate consistency?
  ├─ YES → Use Strong Consistency
  │        (Wait for confirmation from server)
  │
  └─ NO  → Does order matter?
           ├─ YES → Use Causal Consistency
           │        (Order guaranteed, but eventually consistent)
           │
           └─ NO  → Use Eventual Consistency
                    (Fastest, eventually consistent)
```

### Which Architecture?

```
Do you need to work OFFLINE?
  ├─ YES → Start with Centralized + Offline Cache
  │        (Client-Server with local sync)
  │
  └─ NO  → Can you rely on single server?
           ├─ YES → Use Centralized (Simplest)
           │
           └─ NO  → Use Hybrid with Edge Servers
                    (Replicate data closer to users)
```

### Which Communication?

```
Do you NEED immediate response?
  ├─ YES → Request-Reply (HTTPS)
  │
  └─ NO  → Do multiple parties need the data?
           ├─ YES → Pub-Sub (Events/WebSocket)
           │
           └─ NO  → Message Queue (Guarantees delivery)
```

---

## Real-World Examples

### Amazon S3 (Cloud Storage)
- **Type:** Distributed information system
- **Consistency:** Eventual (PUT → GET may be old data)
- **Availability:** Very high (99.99%)
- **Partitioning:** Geo-replicated

### Spotify (P2P Music Streaming)
- **Type:** P2P + centralized coordination
- **Consistency:** Eventual
- **Availability:** Users have cache
- **Optimization:** Edge caching, P2P fallback

### Google Maps (Distributed Real-Time)
- **Type:** Distributed information system
- **Consistency:** Eventual (map updates delayed)
- **Availability:** Offline maps cache
- **Latency:** < 1 second with CDN

### WhatsApp (P2P Messaging)
- **Type:** Hybrid (P2P + servers)
- **Consistency:** Causal (message order preserved)
- **Availability:** Offline queue
- **Scale:** Billions of messages

### TaskFlow (Our System)
- **Type:** Distributed information system
- **Consistency:** Strong (server commits atomically)
- **Availability:** High (Supabase infrastructure)
- **Resilience:** Offline-first PWA

---

## Failure Scenarios & Responses

### Network Partition (Client isolated)

```
┌─────────────┐        X        ┌─────────────┐
│   Client    │    (Network)    │   Server    │
└─────────────┘        X        └─────────────┘
   Strategy:
   1. Cache local copy
   2. Queue operations
   3. Sync when reconnected
```

### Server Crash (Data loss risk)

```
Server ↓ (not responding)
  → Fallback to cached data
  → Show "offline mode" notice
  → Sync when server recovers
```

### Database Corruption

```
Backup Recovery:
  → Use PostgreSQL backups (automatic)
  → RLS prevents data leakage
  → Version history for recovery
```

### Replica Divergence

```
Replica 1: data = X
Replica 2: data = Y
  → Use vector clocks to detect
  → Resolve with conflict resolution policy
  → Replicate correct version
```

---

## Performance Metrics

### Response Time
```
Target: < 200ms for API calls
Measurement: Server response + network latency

Components:
├─ Database query: 10-50ms
├─ Processing: 5-20ms
├─ Network: 20-100ms
└─ Client overhead: 10-30ms
```

### Availability
```
Target: 99.9% uptime (8.7 hours downtime/year)

Formula: Uptime = (Total - Downtime) / Total × 100%

Supabase Infrastructure:
├─ 99.99% SLA
├─ Auto-scaling
└─ Auto-failover
```

### Throughput
```
Measure: Requests/second the system handles

TaskFlow estimate:
├─ Single user: 10 RPS (rapid clicking)
├─ 100 users: 1,000 RPS
├─ 10,000 users: 100,000 RPS (needs scaling)
└─ Solution: Read replicas, caching, connection pooling
```

### Latency Percentiles
```
p50 (median): 50% of requests faster
p95: 95% of requests faster (better measure)
p99: 99% of requests faster (worst case)

Target:
├─ p50: < 50ms
├─ p95: < 200ms
└─ p99: < 1000ms
```

---

## Deployment Checklist

- [ ] **Authentication:** JWT tokens configured
- [ ] **Database:** RLS policies enabled
- [ ] **Caching:** Redis/CDN configured
- [ ] **Monitoring:** Error tracking (Sentry)
- [ ] **Backups:** Automatic backups enabled
- [ ] **Disaster Recovery:** Tested failover
- [ ] **Performance:** Load tested (k6, Artillery)
- [ ] **Security:** SSL/TLS, CORS configured
- [ ] **Logging:** Centralized logging (ELK stack)
- [ ] **Alerting:** PagerDuty notifications

---

## Key Takeaways

### For Interview/Exam

1. **Define:** "A distributed system is multiple independent computers..."
2. **Key Challenge:** "No global clock makes ordering difficult"
3. **Consistency vs Availability:** "CAP theorem - pick 2 of 3"
4. **Patterns:** "Circuit breaker, bulkhead, retry for resilience"
5. **Scalability:** "Horizontal (more servers) vs Vertical (bigger server)"

### For Implementation

1. **Start Simple:** Centralized is easiest
2. **Add Resilience:** Caching, retries, offline support
3. **Monitor:** Track latency, errors, uptime
4. **Iterate:** Optimize based on real metrics
5. **Document:** Architecture decisions for team

### For TaskFlow

1. **Current:** Centralized client-server
2. **Resilience:** Offline-first PWA, sync queue
3. **Scalability:** Pagination, caching, indexes
4. **Security:** RLS, JWT, HTTPS
5. **Future:** Edge functions, CDN optimization

---

## Glossary

| Term | Definition | Example |
|------|-----------|---------|
| **Consistency** | All nodes see same data | ACID guarantees |
| **Availability** | System always responsive | 99.9% uptime |
| **Partition Tolerance** | Survives network split | Offline mode |
| **Latency** | Time to respond | 50ms response time |
| **Throughput** | Operations per second | 1000 RPS |
| **Fault Tolerance** | Survives component failure | Retries, backups |
| **Scalability** | Handles growing load | Handle 1M users |
| **Atomicity** | All-or-nothing operation | Atomic transfer |
| **Idempotency** | Safe to retry | Update same task twice |
| **CAP Theorem** | Can't have all 3 | Choose Consistency+Availability |

---

## Further Learning

### Concepts to Study
1. **Consensus Algorithms:** Raft, Paxos
2. **Distributed Databases:** CockroachDB, Google Spanner
3. **Message Brokers:** Kafka, RabbitMQ
4. **Orchestration:** Kubernetes, Docker Compose
5. **Monitoring:** Prometheus, Grafana

### Recommended Reading
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "The Art of Computer Systems Performance Analysis" - Raj Jain
- "Release It!" - Michael Nygard (patterns for production)

### Practice Projects
1. Build a simple chat app (real-time events)
2. Implement offline sync (PWA)
3. Design a rate limiter (scalability)
4. Build a notification queue (async processing)
5. Create a multi-region database (geographic distribution)

---

## Notes for Different Roles

### For Frontend Developers
- Focus on: Offline support, optimistic updates, caching
- Learn: Service Workers, IndexedDB, React Query
- Test: Network tab in DevTools, simulate failures

### For Backend Developers
- Focus on: Database design, RLS, transactions, migrations
- Learn: PostgreSQL, Database tuning, Query optimization
- Test: Load testing, chaos engineering, data validation

### For DevOps Engineers
- Focus on: Deployment, monitoring, disaster recovery, scaling
- Learn: Kubernetes, CI/CD, Infrastructure as Code
- Test: Failover scenarios, backup restoration, load tests

### For System Designers
- Focus on: Architecture, consistency models, trade-offs
- Learn: CAP theorem, PACELC, reliability patterns
- Test: Design reviews, risk analysis, performance modeling

---

## Common Interview Questions

### Q1: "How would you design a task management system?"
**Answer Framework:**
1. Define requirements (scale, consistency needs)
2. Choose architecture (centralized good start)
3. Identify bottlenecks (database, cache, network)
4. Add resilience (retries, offline, monitoring)
5. Plan scaling (read replicas, CDN, sharding)

### Q2: "What happens if the database goes down?"
**Answer:**
- Immediate: Return cached data to clients
- Short-term: Queue operations offline
- Medium-term: Sync when database recovers
- Long-term: Use database replication/failover

### Q3: "How do you handle consistency across regions?"
**Answer:**
- Use eventual consistency for geo-distribution
- Accept temporary inconsistency
- Use vector clocks for causal ordering
- Replicate to nearest region first

### Q4: "Design a notification system for 1M users"
**Answer:**
- Don't send immediately → Use queue
- Batch notifications → Send in groups
- Prioritize notifications → VIP users first
- Deduplicate → Don't repeat messages
- Scale with workers → Process queue in parallel

### Q5: "How would you debug a performance issue?"
**Answer:**
- Measure: Use APM tools (New Relic, Datadog)
- Identify: Database slow? Network? Client?
- Profile: Database query explain plan, flamegraph
- Optimize: Index, cache, batch, or refactor
- Verify: Monitor metrics after change

---

End of Quick Reference Guide
