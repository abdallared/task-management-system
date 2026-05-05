# System Architecture

## Document Information
- **Project**: TaskFlow
- **Version**: 1.0.0
- **Date**: May 5, 2026

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [System Components](#2-system-components)
3. [Data Flow](#3-data-flow)
4. [Security Architecture](#4-security-architecture)
5. [Deployment Architecture](#5-deployment-architecture)
6. [Scalability & Performance](#6-scalability--performance)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Web Application                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  React   │  │  React   │  │   dnd    │  │Tailwind  │  │  │
│  │  │   Core   │  │  Query   │  │   kit    │  │   CSS    │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    HTTPS (REST) / WebSocket
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Supabase Platform                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   Auth   │  │PostgREST │  │ Realtime │  │   Edge   │  │  │
│  │  │  (JWT)   │  │   API    │  │(WebSocket)│  │Functions │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                         DATA TIER                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  PostgreSQL Database                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  Tables  │  │   RLS    │  │ Triggers │  │  Indexes │  │  │
│  │  │  Schema  │  │ Policies │  │Functions │  │          │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Style
- **Pattern**: Three-tier architecture (Client-Application-Data)
- **Communication**: RESTful API + WebSocket
- **State Management**: Client-side with server synchronization
- **Security**: Zero-trust with RLS at database level

---

## 2. System Components

### 2.1 Client Layer

#### 2.1.1 Web Application (React)
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, modals
│   ├── layout/         # Navbar, sidebar, layout
│   ├── tasks/          # Task-related components
│   ├── groups/         # Group-related components
│   └── notifications/  # Notification components
│
├── pages/              # Route pages
│   ├── auth/           # Login, register, reset
│   ├── dashboard/      # Main dashboard
│   ├── groups/         # Group views
│   └── tasks/          # Task views
│
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   ├── useTasks.js     # Task management hook
│   ├── useRealtime.js  # WebSocket hook
│   └── useNotifications.js
│
├── services/           # API service layer
│   ├── api/
│   │   ├── auth.js     # Auth API calls
│   │   ├── tasks.js    # Task API calls
│   │   ├── groups.js   # Group API calls
│   │   └── comments.js # Comment API calls
│   └── supabase.js     # Supabase client
│
├── store/              # State management
│   ├── authStore.js    # Auth state (Zustand)
│   ├── groupStore.js   # Current group state
│   └── themeStore.js   # Theme state
│
├── utils/              # Utility functions
│   ├── validation.js   # Form validation
│   ├── formatting.js   # Date, time formatting
│   └── constants.js    # App constants
│
└── App.jsx             # Root component
```

#### 2.1.2 Key Technologies
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI framework | 18.x |
| React Router | Routing | 6.x |
| React Query | Server state | 5.x |
| Zustand | Client state | 4.x |
| Tailwind CSS | Styling | 3.x |
| dnd-kit | Drag & drop | 6.x |
| date-fns | Date utilities | 3.x |
| Zod | Validation | 3.x |

---

### 2.2 Application Layer (Supabase)

#### 2.2.1 Supabase Auth
```
┌─────────────────────────────────────┐
│         Authentication Flow          │
├─────────────────────────────────────┤
│                                      │
│  1. User submits credentials        │
│  2. Supabase Auth validates         │
│  3. Generate JWT token              │
│  4. Return token + user data        │
│  5. Client stores token             │
│  6. Token included in all requests  │
│  7. RLS validates token             │
│                                      │
└─────────────────────────────────────┘
```

**Features**:
- Email/password authentication
- JWT token generation (HS256)
- Token refresh mechanism
- Password reset flow
- Email verification

#### 2.2.2 PostgREST API
```
┌─────────────────────────────────────┐
│          API Endpoints               │
├─────────────────────────────────────┤
│                                      │
│  GET    /groups                     │
│  POST   /groups                     │
│  PATCH  /groups?id=eq.{id}          │
│  DELETE /groups?id=eq.{id}          │
│                                      │
│  GET    /tasks?group_id=eq.{id}     │
│  POST   /tasks                      │
│  PATCH  /tasks?id=eq.{id}           │
│  DELETE /tasks?id=eq.{id}           │
│                                      │
│  GET    /task_comments?task_id=...  │
│  POST   /task_comments              │
│                                      │
│  GET    /notifications?user_id=...  │
│  PATCH  /notifications?id=eq.{id}   │
│                                      │
└─────────────────────────────────────┘
```

**Features**:
- Auto-generated from database schema
- Filtering, sorting, pagination
- Joins and nested resources
- RLS enforcement
- OpenAPI documentation

#### 2.2.3 Supabase Realtime
```
┌─────────────────────────────────────┐
│       Real-time Subscriptions        │
├─────────────────────────────────────┤
│                                      │
│  Channel: tasks:{group_id}          │
│  Events:                             │
│    - INSERT (new task)              │
│    - UPDATE (task changed)          │
│    - DELETE (task removed)          │
│                                      │
│  Channel: notifications:{user_id}   │
│  Events:                             │
│    - INSERT (new notification)      │
│                                      │
│  Channel: task_comments:{task_id}   │
│  Events:                             │
│    - INSERT (new comment)           │
│    - UPDATE (comment edited)        │
│                                      │
└─────────────────────────────────────┘
```

**Features**:
- WebSocket-based
- Automatic reconnection
- Presence tracking
- Broadcast messages
- PostgreSQL CDC (Change Data Capture)

#### 2.2.4 Edge Functions
```
functions/
├── send-invitation-email/
│   └── index.ts        # Send group invitation emails
│
├── create-recurring-tasks/
│   └── index.ts        # Cron job for recurring tasks
│
├── send-notification-digest/
│   └── index.ts        # Daily/weekly notification digest
│
└── cleanup-expired-invitations/
    └── index.ts        # Remove expired invitations
```

**Use Cases**:
- Email sending (invitations, notifications)
- Scheduled tasks (cron jobs)
- Complex business logic
- Third-party integrations

---

### 2.3 Data Layer (PostgreSQL)

#### 2.3.1 Database Schema Overview
```
┌──────────────┐
│ auth.users   │ (Supabase managed)
└──────┬───────┘
       │
       │ Referenced by multiple tables
       ↓
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    groups    │────→│group_members │←────│group_invitations│
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │ 1:N
       ↓
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    tasks     │────→│task_assignments│   │    labels    │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                           │
       │ N:M                                       │
       ├──────────────────────────────────────────┘
       │             task_labels
       │
       ├────→ task_comments
       ├────→ task_dependencies
       ├────→ task_time_entries
       └────→ activity_log

┌──────────────┐     ┌──────────────┐
│notifications │     │  audit_logs  │
└──────────────┘     └──────────────┘
```

#### 2.3.2 Core Tables

**groups**
- Stores group information
- Soft delete support (archived flag)
- Tracks creator

**group_members**
- Many-to-many relationship
- Stores role (owner/admin/member/viewer)
- Unique constraint on (group_id, user_id)

**tasks**
- Core task data
- Self-referencing for subtasks (parent_task_id)
- Template support (is_template flag)
- Recurring task support

**task_assignments**
- Many-to-many (tasks ↔ users)
- Tracks who assigned
- Timestamp for assignment

**task_comments**
- Stores comments on tasks
- Mentions stored as array
- Edit tracking

**activity_log**
- Audit trail for all changes
- JSONB for flexible change tracking
- Indexed for performance

**notifications**
- User-specific notifications
- Type-based categorization
- Read/unread tracking

---

## 3. Data Flow

### 3.1 Task Creation Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Fill form & submit
     ↓
┌─────────────────┐
│  React Form     │
└────┬────────────┘
     │ 2. Validate with Zod
     ↓
┌─────────────────┐
│  Task Service   │
└────┬────────────┘
     │ 3. POST /tasks (with JWT)
     ↓
┌─────────────────┐
│  PostgREST API  │
└────┬────────────┘
     │ 4. Verify JWT
     ↓
┌─────────────────┐
│  RLS Policies   │
└────┬────────────┘
     │ 5. Check group membership
     ↓
┌─────────────────┐
│  INSERT task    │
└────┬────────────┘
     │ 6. Trigger fires
     ↓
┌─────────────────┐
│  Create Activity│
│  Log Entry      │
└────┬────────────┘
     │ 7. Create notifications
     ↓
┌─────────────────┐
│  Notify Assigned│
│  Users          │
└────┬────────────┘
     │ 8. Broadcast via Realtime
     ↓
┌─────────────────┐
│  All Clients    │
│  Receive Update │
└─────────────────┘
```

### 3.2 Real-time Update Flow

```
User A                    Database                  User B, C, D
  │                          │                          │
  │ 1. Update task          │                          │
  ├────────────────────────→│                          │
  │                          │                          │
  │                          │ 2. Update row           │
  │                          │                          │
  │                          │ 3. Trigger fires        │
  │                          │                          │
  │                          │ 4. Realtime detects     │
  │                          │    change (CDC)         │
  │                          │                          │
  │                          │ 5. Broadcast to         │
  │                          │    subscribers          │
  │                          ├─────────────────────────→│
  │                          │                          │
  │ 6. Receive confirmation │                          │
  │←────────────────────────┤                          │
  │                          │                          │
  │                          │ 7. UI auto-updates      │
  │                          │                          ↓
  │                          │                    [Task updated]
```

### 3.3 Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter email/password
     ↓
┌─────────────────┐
│  Login Form     │
└────┬────────────┘
     │ 2. POST /auth/v1/token
     ↓
┌─────────────────┐
│  Supabase Auth  │
└────┬────────────┘
     │ 3. Verify credentials
     │ 4. Generate JWT
     ↓
┌─────────────────┐
│  Return Token   │
│  + User Data    │
└────┬────────────┘
     │ 5. Store in localStorage
     ↓
┌─────────────────┐
│  Auth Context   │
│  (React)        │
└────┬────────────┘
     │ 6. Set auth state
     ↓
┌─────────────────┐
│  Redirect to    │
│  Dashboard      │
└─────────────────┘

All subsequent requests:
┌─────────────────┐
│  API Request    │
│  + JWT Header   │
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  RLS Validates  │
│  JWT & Extracts │
│  auth.uid()     │
└─────────────────┘
```

### 3.4 Notification Flow

```
Event Trigger
(assignment, mention, due date)
     │
     ↓
┌─────────────────┐
│  Database       │
│  Trigger or     │
│  Edge Function  │
└────┬────────────┘
     │
     ↓
┌─────────────────┐
│  INSERT into    │
│  notifications  │
└────┬────────────┘
     │
     ├──────────────────┬──────────────────┐
     │                  │                  │
     ↓                  ↓                  ↓
┌──────────┐    ┌──────────┐      ┌──────────┐
│ Realtime │    │   Edge   │      │ Activity │
│Broadcast │    │ Function │      │   Log    │
└────┬─────┘    └────┬─────┘      └──────────┘
     │               │
     │               │ Send Email
     │               │ (optional)
     ↓               ↓
┌──────────┐    ┌──────────┐
│  User's  │    │  User's  │
│  Browser │    │  Email   │
└──────────┘    └──────────┘
```

---

## 4. Security Architecture

### 4.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Layer 1: Network Security                              │
│  ├─ HTTPS/TLS 1.3 only                                 │
│  ├─ CORS configuration                                  │
│  └─ Rate limiting                                       │
│                                                          │
│  Layer 2: Authentication                                │
│  ├─ JWT tokens (HS256)                                 │
│  ├─ Token expiration (7 days)                          │
│  ├─ Secure password hashing (bcrypt)                   │
│  └─ Email verification                                  │
│                                                          │
│  Layer 3: Authorization (RLS)                           │
│  ├─ Row-level security policies                        │
│  ├─ Role-based access control                          │
│  ├─ Group membership validation                        │
│  └─ Resource ownership checks                          │
│                                                          │
│  Layer 4: Input Validation                              │
│  ├─ Client-side validation (Zod)                       │
│  ├─ Server-side validation (PostgreSQL)                │
│  ├─ SQL injection prevention                           │
│  └─ XSS prevention                                      │
│                                                          │
│  Layer 5: Audit & Monitoring                            │
│  ├─ Activity logging                                    │
│  ├─ Audit logs                                          │
│  ├─ Error tracking (Sentry)                            │
│  └─ Security alerts                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Row Level Security (RLS) Architecture

```sql
-- Example: Tasks table RLS

-- Policy 1: Users can view tasks in their groups
CREATE POLICY "view_group_tasks"
ON tasks FOR SELECT
USING (
  group_id IN (
    SELECT group_id 
    FROM group_members 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Members can create tasks
CREATE POLICY "create_tasks"
ON tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM group_members
    WHERE group_id = tasks.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'member')
  )
);

-- Policy 3: Members can update tasks
CREATE POLICY "update_tasks"
ON tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM group_members
    WHERE group_id = tasks.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin', 'member')
  )
);

-- Policy 4: Only admins can delete
CREATE POLICY "delete_tasks"
ON tasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM group_members
    WHERE group_id = tasks.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

### 4.3 Security Best Practices

| Area | Practice | Implementation |
|------|----------|----------------|
| **Passwords** | Strong hashing | bcrypt with salt |
| **Tokens** | Secure storage | httpOnly cookies or secure localStorage |
| **API** | Rate limiting | Supabase built-in |
| **Database** | Parameterized queries | PostgREST automatic |
| **XSS** | Content sanitization | DOMPurify for rich text |
| **CSRF** | Token validation | SameSite cookies |
| **Secrets** | Environment variables | Never commit to git |

---

## 5. Deployment Architecture

### 5.1 Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  CDN (Cloudflare)                        │
│  ├─ Static assets caching                               │
│  ├─ DDoS protection                                      │
│  └─ SSL/TLS termination                                  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  Vercel/Netlify  │    │    Supabase      │
│  (Frontend)      │    │    (Backend)     │
│                  │    │                  │
│  ├─ React App    │    │  ├─ Auth         │
│  ├─ Auto-deploy  │    │  ├─ Database     │
│  └─ Edge network │    │  ├─ Realtime     │
│                  │    │  └─ Edge Fns     │
└──────────────────┘    └──────────────────┘
```

### 5.2 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Repository                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Push to main branch
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions                          │
│                                                          │
│  Step 1: Checkout code                                  │
│  Step 2: Install dependencies                           │
│  Step 3: Run linter (ESLint)                           │
│  Step 4: Run tests (Jest/Vitest)                       │
│  Step 5: Build application                              │
│  Step 6: Run E2E tests (Playwright)                    │
│  Step 7: Deploy to Vercel                              │
│  Step 8: Run smoke tests                                │
│  Step 9: Notify team (Slack)                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Environment Configuration

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| **Development** | Local development | Local Supabase | localhost:3000 |
| **Staging** | Testing & QA | Staging DB | staging.taskflow.app |
| **Production** | Live users | Production DB | taskflow.app |

---

## 6. Scalability & Performance

### 6.1 Scalability Strategy

```
┌─────────────────────────────────────────────────────────┐
│                  Horizontal Scaling                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Vercel):                                     │
│  ├─ Automatic scaling                                   │
│  ├─ Edge network (global)                              │
│  └─ CDN caching                                         │
│                                                          │
│  Backend (Supabase):                                    │
│  ├─ Connection pooling (PgBouncer)                     │
│  ├─ Read replicas (future)                             │
│  └─ Auto-scaling compute                                │
│                                                          │
│  Database:                                               │
│  ├─ Vertical scaling (upgrade plan)                    │
│  ├─ Partitioning (for large tables)                    │
│  └─ Archiving old data                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Performance Optimization

#### 6.2.1 Database Optimization
```sql
-- Indexes for common queries
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Composite indexes
CREATE INDEX idx_tasks_group_status ON tasks(group_id, status);
CREATE INDEX idx_activity_log_group_time ON activity_log(group_id, created_at DESC);

-- Partial indexes
CREATE INDEX idx_active_tasks ON tasks(group_id) WHERE status != 'done';
CREATE INDEX idx_unread_notifications ON notifications(user_id) WHERE read = false;
```

#### 6.2.2 Caching Strategy
```
┌─────────────────────────────────────────────────────────┐
│                    Caching Layers                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Browser Cache:                                         │
│  ├─ Static assets (1 year)                             │
│  ├─ Images (1 month)                                    │
│  └─ Service Worker (PWA)                                │
│                                                          │
│  React Query Cache:                                     │
│  ├─ Task lists (5 minutes)                             │
│  ├─ Group data (10 minutes)                            │
│  ├─ User profiles (30 minutes)                         │
│  └─ Stale-while-revalidate                             │
│                                                          │
│  CDN Cache:                                              │
│  ├─ Static pages                                        │
│  └─ API responses (short TTL)                           │
│                                                          │
│  Database Cache:                                         │
│  ├─ Query result cache                                  │
│  └─ Connection pooling                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 6.2.3 Query Optimization
```javascript
// Bad: N+1 query problem
const tasks = await supabase.from('tasks').select('*')
for (const task of tasks) {
  const comments = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', task.id)
}

// Good: Single query with join
const tasks = await supabase
  .from('tasks')
  .select(`
    *,
    comments:task_comments(*)
  `)
```

### 6.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load** | < 2s | Lighthouse |
| **API Response** | < 200ms | p95 |
| **Realtime Latency** | < 500ms | Custom monitoring |
| **Database Query** | < 100ms | pg_stat_statements |
| **Time to Interactive** | < 3s | Lighthouse |

### 6.4 Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Stack                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Application Monitoring:                                │
│  ├─ Sentry (Error tracking)                            │
│  ├─ Vercel Analytics (Performance)                     │
│  └─ Custom metrics (React Query DevTools)              │
│                                                          │
│  Database Monitoring:                                   │
│  ├─ Supabase Dashboard                                 │
│  ├─ pg_stat_statements                                 │
│  └─ Connection pool metrics                             │
│                                                          │
│  User Analytics:                                        │
│  ├─ Plausible/Umami (Privacy-friendly)                │
│  └─ Custom events                                       │
│                                                          │
│  Alerts:                                                 │
│  ├─ Error rate > threshold                             │
│  ├─ Response time > threshold                          │
│  ├─ Database connections > 80%                         │
│  └─ Disk usage > 80%                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0.0  
**Last Updated**: May 5, 2026  
**Next Review**: June 5, 2026
