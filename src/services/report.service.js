import { supabase, handleSupabaseError } from '../lib/supabase'

export const ReportService = {
  /**
   * Aggregate monthly cashflow trends
   */
  async getCashflowReport() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_type, amount, transaction_date')
        .is('deleted_at', null)
        .order('transaction_date', { ascending: true })

      if (error) throw error

      const monthMap = {}
      for (const t of data || []) {
        const monthKey = t.transaction_date.substring(0, 7) // 'YYYY-MM'
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { month: monthKey, income: 0, expense: 0, savings: 0 }
        }
        const val = Number(t.amount) || 0
        if (t.transaction_type === 'income' || t.transaction_type === 'refund') {
          monthMap[monthKey].income += val
        } else if (t.transaction_type === 'expense') {
          monthMap[monthKey].expense += val
        }
        monthMap[monthKey].savings = monthMap[monthKey].income - monthMap[monthKey].expense
      }

      return Object.values(monthMap)
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to generate cashflow report')
    }
  },

  /**
   * Category spending distribution
   */
  async getCategoryBreakdown() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          category:categories(id, name, color)
        `)
        .eq('transaction_type', 'expense')
        .is('deleted_at', null)

      if (error) throw error

      const breakdown = {}
      for (const t of data || []) {
        const name = t.category?.name || 'Other'
        const color = t.category?.color || '#8AAB8F'
        if (!breakdown[name]) {
          breakdown[name] = { name, value: 0, color }
        }
        breakdown[name].value += Number(t.amount) || 0
      }

      return Object.values(breakdown).sort((a, b) => b.value - a.value)
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to generate category breakdown')
    }
  },
}
