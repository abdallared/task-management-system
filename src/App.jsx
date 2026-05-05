import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, lazy, Suspense } from 'react'
import { supabase } from './services/supabase'
import { AuthProvider } from './hooks/useAuth.jsx'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const GroupPage = lazy(() => import('./pages/groups/GroupPage'))
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage'))
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'))
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'))
const GroupsManagement = lazy(() => import('./pages/admin/GroupsManagement'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// Components
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
)

function App() {
  const { setUser, setSession } = useAuthStore()
  const routerBase = import.meta.env.BASE_URL

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
      <BrowserRouter basename={routerBase}>
        <Suspense fallback={<LoadingFallback />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
