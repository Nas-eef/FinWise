import { supabase, handleSupabaseError } from '../lib/supabase'

export const NotificationService = {
  /**
   * Fetch all user notifications
   */
  async getNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        read: n.is_read,
        time: new Date(n.created_at).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch notifications')
    }
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to mark notification as read')
    }
  },

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to mark all as read')
    }
  },
}
