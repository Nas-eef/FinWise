import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../utils/supabase'
import { Mail, ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setError('')
    setIsLoading(true)

    try {
      // Supabase Password Reset request
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (sbError) {
        throw sbError
      }

      setIsSent(true)
    } catch (err) {
      console.warn('Supabase reset password note:', err)
      // If Supabase returns rate limit or SMTP not configured in user's free tier,
      // still allow them to proceed smoothly to simulate/enter their password
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError('Security rate limit reached for email. Please wait a few moments or use the direct reset option below.')
      } else {
        setError(err.message || 'Unable to send reset instructions. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-forest">Reset Password</h2>
        <p className="text-xs text-mutedgreen mt-1">
          We'll send recovery instructions to your email
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isSent ? (
        <div className="p-5 bg-mint/40 border border-sage/40 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-forest text-mint mx-auto flex items-center justify-center shadow-subtle">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-sm font-black text-forest">Reset Link Sent!</h4>
          <p className="text-xs text-mutedgreen leading-relaxed">
            Please check your inbox at <strong className="text-forest">{email}</strong> and click the link to reset your password.
          </p>
          <div className="pt-2 border-t border-brand-border/60">
            <Link
              to="/reset-password"
              className="inline-block text-xs font-bold text-forest underline hover:text-sage"
            >
              Continue to Set New Password →
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">
              Your Registered Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-mutedgreen" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-semibold text-forest outline-none focus:border-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Instructions</span>}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-brand-border/60">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  )
}
