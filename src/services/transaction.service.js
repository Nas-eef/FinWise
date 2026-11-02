import { supabase, handleSupabaseError } from '../lib/supabase'

export const TransactionService = {
  /**
   * Fetch user's transactions with filtering & pagination
   */
  async getTransactions(filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(id, name, account_type),
          category:categories(id, name, type, icon, color)
        `)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.type) {
        query = query.eq('transaction_type', filters.type)
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId)
      }
      if (filters.startDate) {
        query = query.gte('transaction_date', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('transaction_date', filters.endDate)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []).map((t) => ({
        id: t.id,
        type: t.transaction_type,
        amount: Number(t.amount) || 0,
        date: t.transaction_date,
        description: t.description,
        notes: t.notes,
        paymentMethod: t.payment_method,
        categoryId: t.category_id,
        category: t.category,
        accountId: t.account_id,
        account: t.account,
        groupId: t.group_id || null,
        attachmentUrl: t.attachment_url,
        createdAt: t.created_at,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch transactions')
    }
  },

  /**
   * Create a new transaction
   * Database trigger applies atomic ledger updates to current_balance automatically!
   */
  async createTransaction(txData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const amount = Number(txData.amount)
      if (amount <= 0) throw new Error('Amount must be positive')

      const payload = {
        user_id: user.id,
        transaction_type: txData.type || 'expense',
        amount,
        description: txData.description?.trim() || 'Transaction',
        notes: txData.notes || null,
        transaction_date: txData.date || new Date().toISOString().split('T')[0],
        payment_method: txData.paymentMethod || 'Card',
        category_id: txData.categoryId || null,
        account_id: txData.accountId || null,
        attachment_url: txData.attachmentUrl || null,
      }

      // If group_id is provided, include it
      if (txData.groupId) {
        payload.group_id = txData.groupId
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select(`
          *,
          account:accounts(id, name, account_type),
          category:categories(id, name, type, icon, color)
        `)
        .single()

      if (error) throw error

      return {
        id: data.id,
        type: data.transaction_type,
        amount: Number(data.amount),
        date: data.transaction_date,
        description: data.description,
        notes: data.notes,
        categoryId: data.category_id,
        category: data.category,
        accountId: data.account_id,
        groupId: data.group_id,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create transaction')
    }
  },

  /**
   * Update transaction
   */
  async updateTransaction(id, updates) {
    try {
      const payload = {}
      if (updates.type) payload.transaction_type = updates.type
      if (updates.amount !== undefined) payload.amount = Number(updates.amount)
      if (updates.description) payload.description = updates.description.trim()
      if (updates.notes !== undefined) payload.notes = updates.notes
      if (updates.date) payload.transaction_date = updates.date
      if (updates.categoryId !== undefined) payload.category_id = updates.categoryId
      if (updates.accountId !== undefined) payload.account_id = updates.accountId
      if (updates.groupId !== undefined) payload.group_id = updates.groupId
      payload.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          account:accounts(id, name, account_type),
          category:categories(id, name, type, icon, color)
        `)
        .single()

      if (error) throw error

      return {
        id: data.id,
        type: data.transaction_type,
        amount: Number(data.amount),
        date: data.transaction_date,
        description: data.description,
        notes: data.notes,
        categoryId: data.category_id,
        accountId: data.account_id,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update transaction')
    }
  },

  /**
   * Delete transaction (Hard delete or soft delete)
   */
  async deleteTransaction(id) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete transaction')
    }
  },

  /**
   * Get Monthly Financial Cashflow Summary
   */
  async getSummary(monthYearPrefix) {
    try {
      const prefix = monthYearPrefix || new Date().toISOString().substring(0, 7) // 'YYYY-MM'
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount, transaction_date')
        .is('deleted_at', null)
        .like('transaction_date', `${prefix}%`)

      if (error) throw error

      let income = 0
      let expense = 0
      for (const t of data || []) {
        const val = Number(t.amount) || 0
        if (t.transaction_type === 'income' || t.transaction_type === 'refund') {
          income += val
        } else if (t.transaction_type === 'expense') {
          expense += val
        }
      }

      return {
        inflow: Math.round(income * 100) / 100,
        outflow: Math.round(expense * 100) / 100,
        net: Math.round((income - expense) * 100) / 100,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch financial summary')
    }
  },
}
