import { supabase, handleSupabaseError } from '../lib/supabase'
import { AccountService } from './account.service'

// Standard UUID regex validator
const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)

// Map initial/mock category slugs to real Supabase categories UUIDs
const CATEGORY_MAP = {
  'cat-food': '0f921730-0caa-4750-9a6e-8d0cbb429a15',
  'cat-transport': '576c7160-13e7-438d-a9ee-e49e557ac2d6',
  'cat-shopping': '6e9f9e76-4322-4fa7-a8ea-2aac071c4b42',
  'cat-rent': '24018b63-b67b-4f87-a248-eb24c5e75cc6',
  'cat-bills': '51d3b94f-42e1-4ee4-8caf-3ed6c7ccae8c',
  'cat-health': 'b41dac50-6ab2-4d8b-9fd2-5eedd3c502ba',
  'cat-entertainment': '2769218b-41de-472a-83a3-2cf1e48d13e2',
  'cat-education': '6c561752-6d71-40a5-99a6-9c6f07c41340',
  'cat-personal': '334cccb0-bc4f-440c-98a8-a5f081f2a0d6',
  'cat-emi': 'a388b235-8d71-4d26-8218-3ff8cdcc30bd',
  'cat-other-exp': '06e496f1-2829-4a5d-bbed-2e81c0589525',
  'cat-salary': '4c20a5bc-1772-40ca-a9c2-5711e8e58879',
  'cat-freelance': 'd3c6b477-f929-4ba8-bc59-23b19b3fa7a6',
  'cat-business': '9226b944-9e8e-4c3b-95da-55fc012051dc',
  'cat-rental': 'fc6b4204-1ce4-498c-96eb-702cdbfb7243',
  'cat-investments': 'af44ec5d-c37e-4f4a-b677-ce317efeaec2',
  'cat-other-inc': '10a59878-c625-4d37-b7f9-b492053c2ee6',
}

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
      if (filters.categoryId && isUuid(filters.categoryId)) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.accountId && isUuid(filters.accountId)) {
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

      if (error) {
        // Fallback to simpler query if join fails
        const simple = await supabase
          .from('transactions')
          .select('*')
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
        if (simple.error) throw simple.error
        return (simple.data || []).map((t) => ({
          id: t.id,
          type: t.transaction_type,
          amount: Number(t.amount) || 0,
          date: t.transaction_date,
          description: t.description,
          notes: t.notes,
          paymentMethod: t.payment_method,
          categoryId: t.category_id,
          accountId: t.account_id,
          groupId: t.group_id || null,
          attachmentUrl: t.attachment_url,
          createdAt: t.created_at,
        }))
      }

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
   * Create a new transaction directly in Supabase
   * Database trigger applies atomic ledger updates to current_balance automatically!
   */
  async createTransaction(txData) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = (await supabase.auth.getUser()).data?.user || sessionData?.session?.user
      if (!user) throw new Error('Not authenticated')

      const amount = Number(txData.amount)
      if (amount <= 0) throw new Error('Amount must be positive')

      // 1. Resolve Category safely to avoid foreign key errors
      let categoryId = null
      const targetCatId = isUuid(txData.categoryId)
        ? txData.categoryId
        : (CATEGORY_MAP[txData.categoryId] || null)

      if (targetCatId) {
        const { data: catExists } = await supabase
          .from('categories')
          .select('id')
          .eq('id', targetCatId)
          .maybeSingle()

        if (catExists?.id) {
          categoryId = catExists.id
        }
      }

      // If category not found by ID, match by type in Supabase
      if (!categoryId) {
        const { data: fallbackCat } = await supabase
          .from('categories')
          .select('id')
          .eq('type', txData.type || 'expense')
          .limit(1)
          .maybeSingle()
        if (fallbackCat?.id) {
          categoryId = fallbackCat.id
        }
      }

      // 2. Resolve valid Account UUID (ensure user has an account)
      let accountId = null
      if (isUuid(txData.accountId)) {
        accountId = txData.accountId
      } else {
        const { data: acc } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
        if (acc?.id) {
          accountId = acc.id
        } else {
          const defAcc = await AccountService.ensureDefaultAccount()
          if (defAcc?.id) accountId = defAcc.id
        }
      }

      // 3. Resolve Group UUID safely
      let groupId = null
      if (isUuid(txData.groupId)) {
        const { data: grpExists } = await supabase
          .from('expense_groups')
          .select('id')
          .eq('id', txData.groupId)
          .maybeSingle()
        if (grpExists?.id) groupId = grpExists.id
      }

      const payload = {
        user_id: user.id,
        transaction_type: txData.type || 'expense',
        amount,
        description: txData.description?.trim() || (txData.type === 'expense' ? 'Expense' : 'Income'),
        notes: txData.notes || null,
        transaction_date: txData.date || new Date().toISOString().split('T')[0],
        payment_method: txData.paymentMethod || 'Card',
        category_id: categoryId,
        account_id: accountId,
        attachment_url: txData.attachmentUrl || null,
      }

      if (groupId) {
        payload.group_id = groupId
      }

      let resultData = null
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select(`
          *,
          account:accounts(id, name, account_type),
          category:categories(id, name, type, icon, color)
        `)
        .maybeSingle()

      if (error || !data) {
        // Fallback to simple insert without joins if relations fail
        const basic = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single()
        if (basic.error) throw basic.error
        resultData = basic.data
      } else {
        resultData = data
      }

      return {
        id: resultData.id,
        type: resultData.transaction_type,
        amount: Number(resultData.amount),
        date: resultData.transaction_date,
        description: resultData.description,
        notes: resultData.notes,
        categoryId: resultData.category_id,
        category: resultData.category || null,
        accountId: resultData.account_id,
        groupId: resultData.group_id,
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
      if (!isUuid(id)) return null

      const payload = {}
      if (updates.type) payload.transaction_type = updates.type
      if (updates.amount !== undefined) payload.amount = Number(updates.amount)
      if (updates.description) payload.description = updates.description.trim()
      if (updates.notes !== undefined) payload.notes = updates.notes
      if (updates.date) payload.transaction_date = updates.date
      if (updates.categoryId !== undefined) {
        payload.category_id = isUuid(updates.categoryId)
          ? updates.categoryId
          : (CATEGORY_MAP[updates.categoryId] || null)
      }
      if (updates.accountId !== undefined) {
        payload.account_id = isUuid(updates.accountId) ? updates.accountId : null
      }
      if (updates.groupId !== undefined) {
        payload.group_id = isUuid(updates.groupId) ? updates.groupId : null
      }
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
      if (!isUuid(id)) return true

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
