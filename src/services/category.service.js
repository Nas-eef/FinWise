import { supabase, handleSupabaseError } from '../lib/supabase'

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
      return (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        icon: c.icon || 'HelpCircle',
        color: c.color || '#242E25',
        isDefault: c.is_default,
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

