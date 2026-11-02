import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { SplashScreen } from './components/common/SplashScreen'
import { supabase } from './utils/supabase'
import { useFinanceStore } from './store/useFinanceStore'

// Main Pages
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Transactions } from './pages/Transactions/Transactions'
import { FriendsNotes } from './pages/FriendsNotes/FriendsNotes'
import { Loans } from './pages/Loans/Loans'
import { Profile } from './pages/Profile/Profile'
import { Settings } from './pages/Settings/Settings'
import { Notifications } from './pages/Settings/Notifications'
import { Reports } from './pages/Reports/Reports'
import { Budgets } from './pages/Budgets/Budgets'
import { Savings } from './pages/Savings/Savings'
import { Accounts } from './pages/Accounts/Accounts'
import { AccountDetails } from './pages/Accounts/AccountDetails'
import { Categories } from './pages/Categories/Categories'
import { Recurring } from './pages/Recurring/Recurring'
import { Calendar } from './pages/Calendar/Calendar'
import { ReceivablesPayables } from './pages/Receivables/ReceivablesPayables'

// Auth Pages
import { Login } from './pages/Auth/Login'
import { Register } from './pages/Auth/Register'
import { ForgotPassword } from './pages/Auth/ForgotPassword'
import { ResetPassword } from './pages/Auth/ResetPassword'
import { VerifyEmail } from './pages/Auth/VerifyEmail'

// Helper: Protect authenticated screens (redirect to /login if not logged in)
const ProtectedRoute = ({ children }) => {
  const user = useFinanceStore((state) => state.user)
  const token = localStorage.getItem('finance_access_token')
  const isAuthenticated = Boolean(token || user?.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Helper: Public-only screens (redirect to / if already logged in)
const PublicRoute = ({ children }) => {
  const user = useFinanceStore((state) => state.user)
  const token = localStorage.getItem('finance_access_token')
  const isAuthenticated = Boolean(token || user?.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const setUser = useFinanceStore((state) => state.setUser)
  const user = useFinanceStore((state) => state.user)
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    let isMounted = true

    // 1. Initial check for active Supabase session
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          localStorage.setItem('finance_access_token', session.access_token)
          if (session.user) {
            setUser({
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              email: session.user.email,
            })
          }
        }
      } catch (err) {
        console.warn('Initial session check error:', err)
      } finally {
        // Show splash for a pleasant mobile launch duration (1.2s)
        setTimeout(() => {
          if (isMounted) {
            setShowSplash(false)
          }
        }, 1200)
      }
    }

    checkAuth()

    // 2. Listen for auth state changes (OAuth redirects, token refresh, sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        localStorage.setItem('finance_access_token', session.access_token)
        if (session.user) {
          setUser({
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            email: session.user.email,
          })
        }
      } else if (!session) {
        localStorage.removeItem('finance_access_token')
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [setUser])

  // While splash screen is active, display the FinWise Splash
  if (showSplash) {
    return <SplashScreen />
  }

  const token = localStorage.getItem('finance_access_token')
  const isLoggedIn = Boolean(token || user?.isAuthenticated)

  return (
    <Routes>
      {/* Authentication Pages (under AuthLayout) */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Main App Layout (Protected: Only accessible when logged in) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/activity" element={<Transactions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/friends-notes" element={<FriendsNotes />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/receivables" element={<ReceivablesPayables />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Default fallback route: If logged in -> Home (/), else -> Login (/login) */}
      <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
    </Routes>
  )
}
