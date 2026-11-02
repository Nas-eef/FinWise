import { supabase } from '../lib/supabase'

export const GroupService = {
  /**
   * Fetch expense groups / purposes from Supabase
   */
  async getGroups() {
    try {
      const { data, error } = await supabase
        .from('expense_groups')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        // Table not migrated yet; fallback gracefully
        return null
      }
      return data || []
    } catch {
      return null
    }
  },

  /**
   * Create expense group in Supabase
   */
  async createGroup(group) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expense_groups')
        .insert({
          user_id: user.id,
          name: group.name.trim(),
          icon: group.icon || 'Folder',
          color: group.color || '#26A69A',
          budget: Number(group.budget) || 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch {
      return null
    }
  },

  /**
   * Delete expense group
   */
  async deleteGroup(id) {
    try {
      const { error } = await supabase.from('expense_groups').delete().eq('id', id)
      if (error) throw error
      return true
    } catch {
      return false
    }
  },
}

