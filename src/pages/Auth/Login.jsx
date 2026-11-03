import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinanceStore } from '../../store/useFinanceStore'
import { supabase } from '../../utils/supabase'
import { AuthService } from '../../services/auth.service'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export const Login = () => {
  const navigate = useNavigate()
  const setUser = useFinanceStore((state) => state.setUser)
  const isAuth = useFinanceStore((state) => state.user.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // 1. Check for Remembered Email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('finwise_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

    // If already authenticated, redirect to home
    const token = localStorage.getItem('finance_access_token')
    if (token && isAuth) {
      navigate('/', { replace: true })
    }
  }, [navigate, isAuth])

  // Google OAuth Login (Native Capacitor mobile app vs Web SPA)
  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      const isNative = Capacitor.isNativePlatform()
      const redirectTo = isNative ? 'com.finwise.app://google-auth' : `${window.location.origin}/`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: isNative,
        },
      })
      if (oauthError) throw oauthError

      if (isNative && data?.url) {
        await Browser.open({ url: data.url, windowName: '_self' })
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Email / Password Login
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    // Save or clear Remember Me
    if (rememberMe) {
      localStorage.setItem('finwise_remembered_email', email.trim())
    } else {
      localStorage.removeItem('finwise_remembered_email')
    }

    setIsLoading(true)
    try {
      // 1. Try Supabase direct auth first
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (sbError) {
        // Fallback to backend API
        const backendRes = await AuthService.login({ email: email.trim(), password })
        if (backendRes?.user) {
          localStorage.setItem('finance_access_token', backendRes.token || 'app-auth-token')
          setUser({
            name: backendRes.user.full_name || email.split('@')[0],
            email: backendRes.user.email,
          })
          navigate('/', { replace: true })
          return
        }
        throw sbError
      } else if (data?.session) {
        localStorage.setItem('finance_access_token', data.session.access_token)
        setUser({
          name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User',
          email: data.user?.email,
        })
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-forest">Welcome back</h2>
        <p className="text-xs text-mutedgreen mt-1">Sign in to your financial dashboard</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error font-medium">
          {error}
        </div>
      )}

      {/* Google Sign-in Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="w-full py-2.5 px-4 bg-white hover:bg-[#F9FAF9] border border-brand-border text-forest font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-forest" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-brand-border w-full"></div>
        <span className="bg-white px-2 text-[10px] uppercase font-bold text-mutedgreen tracking-wider">
          or sign in with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-sage font-bold hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-mutedgreen hover:text-forest"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-mutedgreen font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-brand-border text-forest focus:ring-forest"
            />
            <span>Remember this device</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-brand-border/60">
        <p className="text-xs text-mutedgreen">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-forest hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
