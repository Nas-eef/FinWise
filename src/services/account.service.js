import { supabase, handleSupabaseError } from '../lib/supabase'

export const AccountService = {
  /**
   * Get all accounts for current user
   */
  async getAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []).map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: acc.account_type,
        balance: Number(acc.current_balance) || 0,
        openingBalance: Number(acc.opening_balance) || 0,
        institution: acc.institution_name,
        currency: acc.currency,
        isDefault: acc.is_default,
        isActive: acc.is_active,
        description: acc.description,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch accounts')
    }
  },

  /**
   * Ensure user has at least one default account in Supabase
   */
  async ensureDefaultAccount() {
    try {
      const accounts = await this.getAccounts()
      if (accounts && accounts.length > 0) return accounts[0]

      return await this.createAccount({
        name: 'Primary Bank Account',
        type: 'bank',
        institution: 'Primary Account',
        balance: 0.00,
        isDefault: true,
      })
    } catch {
      return null
    }
  },

  /**
   * Create new account
   */
  async createAccount(accData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const initialBal = Number(accData.balance) || Number(accData.openingBalance) || 0

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: accData.name.trim(),
          account_type: accData.type || 'bank',
          institution_name: accData.institution || accData.institution_name || null,
          opening_balance: initialBal,
          current_balance: initialBal,
          currency: accData.currency || 'INR',
          description: accData.description || null,
          is_default: Boolean(accData.isDefault),
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        type: data.account_type,
        balance: Number(data.current_balance),
        institution: data.institution_name,
        isDefault: data.is_default,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create account')
    }
  },

  /**
   * Update existing account
   */
  async updateAccount(id, updates) {
    try {
      const payload = {}
      if (updates.name) payload.name = updates.name.trim()
      if (updates.type) payload.account_type = updates.type
      if (updates.institution) payload.institution_name = updates.institution
      if (updates.isDefault !== undefined) payload.is_default = updates.isDefault
      payload.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('accounts')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update account')
    }
  },

  /**
   * Delete account
   */
  async deleteAccount(id) {
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete account')
    }
  },

  /**
   * Atomic Money Transfer between user's accounts via Postgres RPC
   */
  async transfer({ fromAccountId, toAccountId, amount, description, transferDate }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const numAmount = Number(amount)
      if (numAmount <= 0) throw new Error('Transfer amount must be greater than zero')
      if (fromAccountId === toAccountId) throw new Error('Cannot transfer to the same account')

      const { data, error } = await supabase.rpc('execute_account_transfer', {
        p_user_id: user.id,
        p_from_account_id: fromAccountId,
        p_to_account_id: toAccountId,
        p_amount: numAmount,
        p_transfer_date: transferDate || new Date().toISOString().split('T')[0],
        p_description: description || 'Internal Transfer',
      })

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Account transfer failed')
    }
  },
}
