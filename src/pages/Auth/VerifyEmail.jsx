import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useFinanceStore } from '../../store/useFinanceStore'
import { AuthService } from '../../services/auth.service'
import { Mail, ArrowRight, RefreshCw, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

export const VerifyEmail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const setUser = useFinanceStore((state) => state.setUser)

  // Resolve email and name from route state or sessionStorage
  const [email, setEmail] = useState(() => {
    return (
      location.state?.email ||
      sessionStorage.getItem('finwise_pending_verification_email') ||
      ''
    )
  })

  const [name] = useState(() => {
    return (
      location.state?.name ||
      sessionStorage.getItem('finwise_pending_verification_name') ||
      ''
    )
  })

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState('')
  const [successNotice, setSuccessNotice] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const inputRefs = useRef([])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Handle single digit entry
  const handleDigitChange = (index, value) => {
    setError('')
    setSuccessNotice('')

    // Only allow single numeric character
    const cleaned = value.replace(/\D/g, '')
    const singleChar = cleaned.slice(-1)

    const nextOtp = [...otp]
    nextOtp[index] = singleChar
    setOtp(nextOtp)

    // Auto-advance to next input box
    if (singleChar && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle clipboard paste of full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

    if (digits.length > 0) {
      const nextOtp = [...otp]
      digits.forEach((digit, i) => {
        if (i < 6) nextOtp[i] = digit
      })
      setOtp(nextOtp)

      const focusIdx = Math.min(digits.length, 5)
      inputRefs.current[focusIdx]?.focus()
    }
  }

  // Submit OTP Verification
  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessNotice('')

    if (!email) {
      setError('Missing registered email address. Please return to registration.')
      return
    }

    const token = otp.join('').trim()
    if (token.length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setIsLoading(true)
    try {
      // Direct Supabase verifyOtp call
      const data = await AuthService.verifySignupOtp({
        email,
        token,
      })

      setIsVerified(true)

      // Establish session
      if (data?.session) {
        localStorage.setItem('finance_access_token', data.session.access_token)
        setUser({
          name: name || data.user?.user_metadata?.full_name || email.split('@')[0],
          email: data.user?.email || email,
        })
      }

      // Cleanup pending storage
      sessionStorage.removeItem('finwise_pending_verification_email')
      sessionStorage.removeItem('finwise_pending_verification_name')

      // Smooth transition to dashboard
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1200)
    } catch (err) {
      setIsLoading(false)
      const msg = err.message ? err.message.toLowerCase() : ''
      if (msg.includes('expired')) {
        setError('Verification code has expired. Please tap "Resend Code" below to receive a new one.')
      } else if (msg.includes('invalid') || msg.includes('token')) {
        setError('Invalid verification code. Please check the code in your email and try again.')
      } else {
        setError(err.message || 'Verification failed. Please check the code and try again.')
      }
    }
  }

  // Resend OTP email via Resend SMTP
  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setError('')
    setSuccessNotice('')

    if (!email) {
      setError('Missing email address. Please register first.')
      return
    }

    setIsResending(true)
    try {
      await AuthService.resendSignupOtp(email)
      setSuccessNotice('A new 6-digit verification code has been sent to your email.')
      setCooldown(60) // 60 seconds cooldown
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError('Security rate limit reached. Please wait a moment before requesting another code.')
        setCooldown(30)
      } else {
        setError(err.message || 'Failed to resend code. Please try again.')
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-5 text-center">
      {/* Icon Header */}
      <div className="w-16 h-16 rounded-3xl bg-mint/40 text-forest mx-auto flex items-center justify-center shadow-subtle ring-4 ring-mint/20">
        <Mail className="w-8 h-8 text-forest" />
      </div>

      <div>
        <h2 className="text-xl font-black text-forest tracking-tight">Verify Your Email</h2>
        <p className="text-xs text-mutedgreen mt-1">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-xs font-bold text-forest mt-0.5 break-all">
          {email || 'your email'}
        </p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-brand-error font-medium text-left flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notice */}
      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-brand-success font-medium text-left flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {isVerified ? (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-success text-white mx-auto flex items-center justify-center shadow-subtle">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-sm font-black text-brand-success">Email Verified!</h4>
          <p className="text-xs text-mutedgreen">Setting up your financial vault...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-5">
          {/* 6 Digit Input Boxes with Paste Support */}
          <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                id={`otp-box-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                autoFocus={idx === 0}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isLoading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black bg-[#FAFBF9] border border-brand-border rounded-xl text-forest outline-none transition-all focus:border-forest focus:ring-2 focus:ring-mint/60 disabled:opacity-50"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Resend Code with 60-second Cooldown */}
      <div className="pt-2 border-t border-brand-border/60 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-2 text-xs text-mutedgreen">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="font-bold text-forest hover:underline disabled:text-mutedgreen disabled:no-underline flex items-center gap-1 transition-colors"
          >
            {isResending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>

        <Link
          to="/register"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-mutedgreen hover:text-forest transition-colors mt-1"
        >
          <ArrowLeft className="w-3 h-3" /> Wrong email? Re-register
        </Link>
      </div>
    </div>
  )
}
