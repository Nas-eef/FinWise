import { supabase, handleSupabaseError } from '../lib/supabase'

export const BudgetService = {
  /**
   * Get active monthly budget and its category limits
   */
  async getActiveBudget() {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: budgets, error } = await supabase
        .from('budgets')
        .select(`
          *,
          categories:budget_categories(
            id,
            category_id,
            allocated_amount,
            category:categories(id, name, type, icon, color)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      const budget = budgets?.[0]
      if (!budget) {
        return {
          monthlyLimit: 0,
          categoryLimits: {},
          budgetId: null,
        }
      }

      const categoryLimits = {}
      budget.categories?.forEach((bc) => {
        categoryLimits[bc.category_id] = Number(bc.allocated_amount) || 0
      })

      return {
        budgetId: budget.id,
        name: budget.name,
        monthlyLimit: Number(budget.total_limit) || 0,
        startDate: budget.start_date,
        endDate: budget.end_date,
        categoryLimits,
        allocations: budget.categories || [],
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch budget')
    }
  },

  /**
   * Set or update monthly budget limit
   */
  async updateMonthlyBudgetLimit(limitAmount) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

      // Check if current month budget already exists
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .gte('start_date', startOfMonth)
        .lte('end_date', endOfMonth)
        .limit(1)

      const limit = Number(limitAmount) || 0

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('budgets')
          .update({ total_limit: limit, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id)
          .select()
          .single()
        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            name: `${monthName} Budget`,
            period_type: 'monthly',
            start_date: startOfMonth,
            end_date: endOfMonth,
            total_limit: limit,
          })
          .select()
          .single()
        if (error) throw error
        return data
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update monthly budget')
    }
  },

  /**
   * Set category allocation within a budget
   */
  async setCategoryLimit(budgetId, categoryId, amount) {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .upsert(
          {
            budget_id: budgetId,
            category_id: categoryId,
            allocated_amount: Number(amount) || 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'budget_id,category_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update category budget')
    }
  },
}
