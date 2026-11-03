import { supabase, handleSupabaseError } from '../lib/supabase'

export const DEFAULT_CATEGORIES = [
  // Expense
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#FF7043' },
  { name: 'Transportation', type: 'expense', icon: 'Car', color: '#42A5F5' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#AB47BC' },
  { name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#26A69A' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#FFA726' },
  { name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#EF5350' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8D6E63' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#5C6BC0' },
  { name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#EC407A' },
  { name: 'Loans & EMI', type: 'expense', icon: 'Landmark', color: '#78909C' },
  { name: 'Other Expenses', type: 'expense', icon: 'MoreHorizontal', color: '#7C827C' },
  // Income
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#43845A' },
  { name: 'Freelancing / Work', type: 'income', icon: 'Laptop', color: '#8AAB8F' },
  { name: 'Business & Sales', type: 'income', icon: 'Building2', color: '#2E7D32' },
  { name: 'Rental Income', type: 'income', icon: 'Building', color: '#558B2F' },
  { name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#00ACC1' },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#689F38' },
]

export const CategoryService = {
  /**
   * Get all categories (System defaults + user custom categories)
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon || 'HelpCircle',
          color: c.color || '#242E25',
          isDefault: c.is_default,
        }))
      }

      // If categories table is completely empty in Supabase, auto-seed system defaults
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user
        if (user) {
          const toInsert = DEFAULT_CATEGORIES.map((cat) => ({
            user_id: user.id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            is_default: true,
            is_active: true,
          }))
          const { data: inserted } = await supabase.from('categories').insert(toInsert).select()
          if (inserted && inserted.length > 0) {
            return inserted.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              icon: c.icon || 'HelpCircle',
              color: c.color || '#242E25',
              isDefault: c.is_default,
            }))
          }
        }
      } catch (seedErr) {
        console.warn('Auto-seed categories note:', seedErr)
      }

      return DEFAULT_CATEGORIES.map((c, idx) => ({
        id: `cat-fallback-${idx}`,
        ...c,
        isDefault: true,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch categories')
    }
  },

  /**
   * Create custom category for authenticated user
   */
  async createCategory(catData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: catData.name.trim(),
          type: catData.type || 'expense',
          icon: catData.icon || 'HelpCircle',
          color: catData.color || '#43845A',
          is_default: false,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create category')
    }
  },

  /**
   * Update custom category
   */
  async updateCategory(id, updates) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: updates.name?.trim(),
          icon: updates.icon,
          color: updates.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update category')
    }
  },

  /**
   * Delete category
   */
  async deleteCategory(id) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete category')
    }
  },
}

