import { supabase, handleSupabaseError } from '../lib/supabase'

export const AuthService = {
  /**
   * Register a new user with Supabase Auth
   */
  async register({ email, password, full_name, phone }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: full_name?.trim() || email.split('@')[0],
            phone: phone || null,
          },
        },
      })

      if (error) throw error

      return {
        user: data.user,
        session: data.session,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Registration failed')
    }
  },

  /**
   * Sign in with Email and Password
   */
  async login({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      return {
        user: data.user,
        session: data.session,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Invalid email or password')
    }
  },

  /**
   * Verify signup 6-digit email OTP
   */
  async verifySignupOtp({ email, token }) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      })
      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'OTP verification failed')
    }
  },

  /**
   * Resend signup verification OTP email
   */
  async resendSignupOtp(email) {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })
      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to resend verification code')
    }
  },

  /**
   * Sign out of Supabase Auth
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      localStorage.removeItem('finance_access_token')
      localStorage.removeItem('finwise_supabase_auth_session')
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to sign out')
    }
  },

  /**
   * Send Password Reset Email
   */
  async forgotPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Password reset request failed')
    }
  },

  /**
   * Update Password (during recovery session)
   */
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update password')
    }
  },

  /**
   * Get Active Session & User
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      return {
        ...user,
        profile: profile || null,
      }
    } catch {
      return null
    }
  },

  /**
   * Update User Profile
   */
  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name || updates.full_name,
          phone: updates.phone,
          currency: updates.currency,
          date_format: updates.dateFormat || updates.date_format,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update profile')
    }
  },

  /**
   * Permanently clear all user data from Supabase PostgreSQL tables
   */
  async clearAllUserData() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user || (await supabase.auth.getUser()).data?.user
      if (!user) throw new Error('Not authenticated')

      // Delete dependent records first to respect foreign key constraints
      await supabase.from('loan_payments').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('loan_installments').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('loans').delete().eq('user_id', user.id).catch(() => {})

      await supabase.from('debt_repayments').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('receivables').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('payables').delete().eq('user_id', user.id).catch(() => {})

      await supabase.from('savings_contributions').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('savings_goals').delete().eq('user_id', user.id).catch(() => {})

      await supabase.from('transfers').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('transactions').delete().eq('user_id', user.id).catch(() => {})

      await supabase.from('recurring_payments').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('reminders').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('notifications').delete().eq('user_id', user.id).catch(() => {})

      // Delete custom budgets & expense groups
      await supabase.from('budget_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000').catch(() => {})
      await supabase.from('budgets').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('expense_groups').delete().eq('user_id', user.id).catch(() => {})

      // Delete document vault, meetings & wiki
      await supabase.from('document_vault').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('meetings_followups').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('personal_wiki').delete().eq('user_id', user.id).catch(() => {})

      // Reset user accounts to zero balance
      await supabase.from('accounts').delete().eq('user_id', user.id).catch(() => {})
      await supabase.from('accounts').insert({
        user_id: user.id,
        name: 'Primary Bank Account',
        account_type: 'bank',
        balance: 0.00,
        currency: 'INR',
        is_default: true,
      }).catch(() => {})

      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to clear user data from database')
    }
  },
}
