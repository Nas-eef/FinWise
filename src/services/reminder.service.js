import { supabase, handleSupabaseError } from '../lib/supabase'

export const ReminderService = {
  /**
   * Fetch all reminders
   */
  async getReminders() {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('reminder_date', { ascending: true })

      if (error) throw error

      return (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        amount: Number(r.amount) || 0,
        dueDate: r.reminder_date,
        completed: r.status === 'completed',
        type: r.reminder_type,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch reminders')
    }
  },

  /**
   * Create reminder
   */
  async createReminder(item) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: user.id,
          title: item.title.trim(),
          description: item.notes || item.description || null,
          amount: Number(item.amount) || 0,
          reminder_date: item.dueDate || item.reminderDate || '2026-11-15',
          reminder_type: item.type || 'bill',
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create reminder')
    }
  },

  /**
   * Toggle completion status
   */
  async toggleReminder(id, currentCompleted) {
    try {
      const nextStatus = currentCompleted ? 'pending' : 'completed'
      const { data, error } = await supabase
        .from('reminders')
        .update({ status: nextStatus })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update reminder status')
    }
  },

  /**
   * Delete reminder
   */
  async deleteReminder(id) {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete reminder')
    }
  },
}

