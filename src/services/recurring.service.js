import { supabase, handleSupabaseError } from '../lib/supabase'

export const RecurringService = {
  /**
   * Fetch recurring subscriptions and payments
   */
  async getRecurring() {
    try {
      const { data, error } = await supabase
        .from('recurring_payments')
        .select(`
          *,
          category:categories(id, name, type, icon, color),
          account:accounts(id, name)
        `)
        .order('next_due_date', { ascending: true })

      if (error) throw error

      return (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount) || 0,
        frequency: r.frequency,
        nextBillingDate: r.next_due_date,
        startDate: r.start_date,
        status: r.status,
        categoryId: r.category_id,
        category: r.category,
        accountId: r.account_id,
        autoPay: r.reminder_enabled,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch recurring payments')
    }
  },

  /**
   * Create recurring payment
   */
  async createRecurring(item) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('recurring_payments')
        .insert({
          user_id: user.id,
          name: item.name.trim(),
          amount: Number(item.amount) || 0,
          frequency: item.frequency || 'monthly',
          next_due_date: item.nextBillingDate || item.nextDueDate || '2026-11-15',
          category_id: item.categoryId || null,
          account_id: item.accountId || null,
          reminder_enabled: Boolean(item.autoPay),
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create recurring payment')
    }
  },

  /**
   * Toggle status between active and paused
   */
  async toggleStatus(id, currentStatus) {
    try {
      const nextStatus = currentStatus === 'active' ? 'paused' : 'active'
      const { data, error } = await supabase
        .from('recurring_payments')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to toggle status')
    }
  },

  /**
   * Update recurring payment
   */
  async updateRecurring(id, updates) {
    try {
      const payload = { updated_at: new Date().toISOString() }
      if (updates.name) payload.name = updates.name.trim()
      if (updates.amount !== undefined) payload.amount = Number(updates.amount)
      if (updates.frequency) payload.frequency = updates.frequency
      if (updates.nextBillingDate) payload.next_due_date = updates.nextBillingDate
      if (updates.autoPay !== undefined) payload.reminder_enabled = Boolean(updates.autoPay)

      const { data, error } = await supabase
        .from('recurring_payments')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update recurring payment')
    }
  },

  /**
   * Delete recurring payment
   */
  async deleteRecurring(id) {
    try {
      const { error } = await supabase.from('recurring_payments').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete recurring payment')
    }
  },
}

