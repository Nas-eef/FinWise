import { supabase, handleSupabaseError } from '../lib/supabase'

export const WikiService = {
  /**
   * Fetch all wiki articles
   */
  async getArticles() {
    try {
      const { data, error } = await supabase
        .from('personal_wiki')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error

      return (data || []).map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category || 'General',
        tags: Array.isArray(a.tags) ? a.tags : [],
        content: a.content || '',
        isPinned: Boolean(a.is_pinned),
        color: a.color || '#242E25',
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      }))
    } catch (err) {
      console.warn('WikiService.getArticles error/warn:', err)
      return []
    }
  },

  /**
   * Create new wiki article
   */
  async createArticle(item) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        title: item.title.trim(),
        category: item.category || 'General',
        tags: Array.isArray(item.tags) ? item.tags : [],
        content: item.content || '',
        is_pinned: Boolean(item.isPinned),
        color: item.color || '#242E25',
      }

      const { data, error } = await supabase
        .from('personal_wiki')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : [],
        content: data.content,
        isPinned: Boolean(data.is_pinned),
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (err) {
      console.warn('WikiService.createArticle error, falling back locally:', err)
      return null
    }
  },

  /**
   * Update wiki article
   */
  async updateArticle(id, updates) {
    try {
      const payload = {}
      if (updates.title !== undefined) payload.title = updates.title.trim()
      if (updates.category !== undefined) payload.category = updates.category
      if (updates.tags !== undefined) payload.tags = updates.tags
      if (updates.content !== undefined) payload.content = updates.content
      if (updates.isPinned !== undefined) payload.is_pinned = Boolean(updates.isPinned)
      if (updates.color !== undefined) payload.color = updates.color
      payload.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('personal_wiki')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.warn('WikiService.updateArticle error:', err)
      return null
    }
  },

  /**
   * Delete wiki article
   */
  async deleteArticle(id) {
    try {
      const { error } = await supabase
        .from('personal_wiki')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.warn('WikiService.deleteArticle error:', err)
      return false
    }
  },
}

