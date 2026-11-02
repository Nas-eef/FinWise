import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../utils/supabase'
import { Lock, Eye, EyeOff, Check, Loader2, AlertCircle, ShieldAlert } from 'lucide-react'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isSessionReady, setIsSessionReady] = useState(false)

  useEffect(() => {
    // 1. Check for active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsSessionReady(true)
      }
    })

    // 2. Listen for auth state change from recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsSessionReady(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      // Supabase update password for authenticated recovery session
      const { error: sbError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (sbError) {
        throw sbError
      }

      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('auth session missing')) {
        setError('Recovery session not detected or expired. Please request a new password reset email.')
      } else {
        setError(msg || 'Failed to update password. Please use the link sent to your email.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-forest">Create New Password</h2>
        <p className="text-xs text-mutedgreen mt-1">Your new password must be at least 8 characters</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-success text-white mx-auto flex items-center justify-center shadow-subtle">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-sm font-black text-brand-success">Password Updated!</h4>
          <p className="text-xs text-mutedgreen">Your password has been changed successfully. Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-mutedgreen" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
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
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-mutedgreen" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-brand-border/60">
        <Link to="/login" className="inline-block text-xs font-bold text-forest hover:underline">
          Cancel and return to Login
        </Link>
      </div>
    </div>
  )
}
