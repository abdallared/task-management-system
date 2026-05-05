# TaskFlow - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with TaskFlow quickly.

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git installed
- Code editor (VS Code recommended)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready (~2 minutes)
5. Note your project URL and anon key

---

## Step 2: Set Up Database

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the complete SQL schema from [COMPLETE-DOCUMENTATION.md](./COMPLETE-DOCUMENTATION.md)
4. Paste and run the SQL
5. Verify tables are created in Table Editor

**Tables you should see:**
- groups
- group_members
- tasks
- task_assignments
- task_comments
- notifications
- activity_log
- audit_logs
- labels
- task_labels
- task_dependencies
- task_time_entries
- group_invitations

---

## Step 3: Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd taskflow

# Install dependencies
npm install
# or
yarn install
```

---

## Step 4: Configure Environment

Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

---

## Step 5: Start Development Server

```bash
npm run dev
# or
yarn dev
```

Visit: **http://localhost:3000**

---

## Step 6: Create Your First User

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter email and password
4. Check email for verification link
5. Click verification link
6. Log in

---

## Step 7: Create Your First Group

1. After login, click "Create Group"
2. Enter group name (e.g., "My Team")
3. Add description (optional)
4. Click "Create"

---

## Step 8: Create Your First Task

1. Inside your group, click "New Task"
2. Enter task title
3. Add description (optional)
4. Set status, priority, due date
5. Click "Create Task"

---

## 🎉 You're Done!

You now have a fully functional task management system!

---

## Next Steps

### Explore Features

1. **Try Different Views**
   - Click view switcher (Board/List/Calendar)
   - Drag tasks between columns

2. **Invite Team Members**
   - Click "Invite Members"
   - Enter email addresses
   - They'll receive invitation emails

3. **Add Comments**
   - Click on a task
   - Add a comment
   - Try mentioning someone with @

4. **Track Time**
   - Open a task
   - Click "Start Timer"
   - Work on task
   - Click "Stop Timer"

5. **Create Subtasks**
   - Open a task
   - Click "Add Subtask"
   - Break down complex work

6. **Set Dependencies**
   - Open a task
   - Click "Add Dependency"
   - Select blocking task

---

## Common Issues & Solutions

### Issue: Can't see tasks
**Solution**: Make sure you're a member of the group. Check group_members table.

### Issue: RLS policy error
**Solution**: Verify you're logged in and JWT token is valid. Check browser console.

### Issue: Real-time not working
**Solution**: Check WebSocket connection in Network tab. Ensure Supabase Realtime is enabled.

### Issue: Email verification not received
**Solution**: Check spam folder. Verify SMTP settings in Supabase Dashboard → Authentication → Email Templates.

---

## Project Structure Overview

```
taskflow/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── store/          # State management
│   └── utils/          # Utilities
├── public/             # Static files
├── docs/               # Documentation
└── .env.local          # Environment variables
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/services/supabase.js` | Supabase client setup |
| `src/hooks/useAuth.js` | Authentication hook |
| `src/hooks/useTasks.js` | Task management hook |
| `src/store/authStore.js` | Auth state (Zustand) |
| `src/App.tsx` | Root component |

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linter
npm run lint

# Format code
npm run format
```

---

## Testing Your Setup

### Test Authentication
```javascript
// In browser console
const { data, error } = await supabase.auth.getSession()
console.log(data) // Should show your session
```

### Test Database Access
```javascript
// In browser console
const { data, error } = await supabase.from('groups').select('*')
console.log(data) // Should show your groups
```

### Test Real-time
```javascript
// In browser console
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks'
  }, (payload) => console.log('Change:', payload))
  .subscribe()
```

---

## Deployment (Optional)

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables
6. Click "Deploy"

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site"
4. Select your repository
5. Add environment variables
6. Click "Deploy"

---

## Getting Help

### Documentation
- [System Overview](./01-SYSTEM-OVERVIEW.md) - High-level overview
- [SRS](./02-SRS.md) - Detailed requirements
- [Architecture](./03-ARCHITECTURE.md) - Technical design
- [Complete Docs](./COMPLETE-DOCUMENTATION.md) - Database & API

### Resources
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com

---

## Tips for Success

1. **Start Small**: Get basic CRUD working first
2. **Test Often**: Use browser console to test API calls
3. **Check RLS**: If queries fail, check RLS policies
4. **Use DevTools**: React Query DevTools are your friend
5. **Read Docs**: All answers are in the documentation

---

## What's Next?

### Phase 1 (Basic Features)
- ✅ Authentication
- ✅ Groups
- ✅ Tasks CRUD
- ✅ Basic UI

### Phase 2 (Collaboration)
- [ ] Real-time updates
- [ ] Comments
- [ ] Notifications
- [ ] Invitations

### Phase 3 (Advanced)
- [ ] Multiple views
- [ ] Time tracking
- [ ] Dependencies
- [ ] Analytics

---

## Congratulations! 🎉

You've successfully set up TaskFlow. Now start building amazing features!

**Happy coding!** 🚀

---

**Version**: 1.0.0  
**Last Updated**: May 5, 2026
