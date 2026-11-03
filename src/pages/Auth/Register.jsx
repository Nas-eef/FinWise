import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFinanceStore } from '../../store/useFinanceStore'
import { supabase } from '../../utils/supabase'
import { AuthService } from '../../services/auth.service'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

export const Register = () => {
  const navigate = useNavigate()
  const setUser = useFinanceStore((state) => state.setUser)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

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
      setError(err.message || 'Google sign-up failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      // Supabase direct registration (triggers Resend SMTP verification email)
      const { user: registeredUser, session } = await AuthService.register({
        email: email.trim(),
        password,
        full_name: name.trim(),
      })

      // Store email in sessionStorage so VerifyEmail retains it on direct refresh
      sessionStorage.setItem('finwise_pending_verification_email', email.trim())
      sessionStorage.setItem('finwise_pending_verification_name', name.trim())

      setIsLoading(false)

      if (session) {
        // Immediate session established
        localStorage.setItem('finance_access_token', session.access_token)
        setUser({
          name: name.trim() || registeredUser?.email?.split('@')[0],
          email: registeredUser?.email,
        })
        navigate('/', { replace: true })
      } else {
        // Verification OTP sent via Resend SMTP
        navigate('/verify-email', { state: { email: email.trim(), name: name.trim() } })
      }
    } catch (err) {
      setIsLoading(false)
      const msg = err.message ? err.message.toLowerCase() : ''
      if (msg.includes('already registered')) {
        setError('This email is already registered. Please sign in or use Forgot Password.')
      } else if (msg.includes('error sending confirmation email')) {
        setError(
          'Email delivery failed. In Supabase Dashboard ➔ SMTP Settings: please verify your Gmail App Password and SMTP credentials.'
        )
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-forest">Create your account</h2>
        <p className="text-xs text-mutedgreen mt-1">Start managing your personal finances</p>
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
        <span>Sign up with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-brand-border w-full"></div>
        <span className="bg-white px-2 text-[10px] uppercase font-bold text-mutedgreen tracking-wider">
          or register with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type="text"
              required
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Password (Min 8 chars)
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div>
          <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-mutedgreen" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-brand-border/60">
        <p className="text-xs text-mutedgreen">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
