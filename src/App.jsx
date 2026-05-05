import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { supabase } from './services/supabase'
import { AuthProvider } from './hooks/useAuth.jsx'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import GroupPage from './pages/groups/GroupPage'
import TaskDetailPage from './pages/tasks/TaskDetailPage'
import CalendarPage from './pages/calendar/CalendarPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersManagement from './pages/admin/UsersManagement'
import GroupsManagement from './pages/admin/GroupsManagement'
import NotFoundPage from './pages/NotFoundPage'

// Components
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { setUser, setSession } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="groups/:groupId" element={<GroupPage />} />
            <Route path="groups/:groupId/calendar" element={<CalendarPage />} />
            <Route path="groups/:groupId/analytics" element={<AnalyticsPage />} />
            <Route path="groups/:groupId/tasks/:taskId" element={<TaskDetailPage />} />
            
            {/* Admin routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UsersManagement />} />
            <Route path="admin/groups" element={<GroupsManagement />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
