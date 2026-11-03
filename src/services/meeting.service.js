import { supabase, handleSupabaseError } from '../lib/supabase'

export const MeetingService = {
  /**
   * Fetch all meetings & follow-ups
   */
  async getMeetings() {
    try {
      const { data, error } = await supabase
        .from('meetings_followups')
        .select('*')
        .order('followup_date', { ascending: true })

      if (error) throw error

      return (data || []).map((m) => ({
        id: m.id,
        title: m.title,
        contactName: m.contact_name || '',
        contactPhone: m.contact_phone || '',
        contactEmail: m.contact_email || '',
        contactRole: m.contact_role || '',
        followupDate: m.followup_date,
        status: m.status || 'scheduled',
        priority: m.priority || 'medium',
        location: m.location || '',
        notes: m.notes || '',
        reminderSent: Boolean(m.reminder_sent),
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }))
    } catch (err) {
      console.warn('MeetingService.getMeetings error/warn:', err)
      return []
    }
  },

  /**
   * Create a new meeting / follow-up
   */
  async createMeeting(item) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        title: item.title.trim(),
        contact_name: item.contactName?.trim() || null,
        contact_phone: item.contactPhone?.trim() || null,
        contact_email: item.contactEmail?.trim() || null,
        contact_role: item.contactRole?.trim() || null,
        followup_date: item.followupDate,
        status: item.status || 'scheduled',
        priority: item.priority || 'medium',
        location: item.location?.trim() || null,
        notes: item.notes?.trim() || null,
      }

      const { data, error } = await supabase
        .from('meetings_followups')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        contactName: data.contact_name || '',
        contactPhone: data.contact_phone || '',
        contactEmail: data.contact_email || '',
        contactRole: data.contact_role || '',
        followupDate: data.followup_date,
        status: data.status,
        priority: data.priority,
        location: data.location || '',
        notes: data.notes || '',
        reminderSent: Boolean(data.reminder_sent),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (err) {
      console.warn('MeetingService.createMeeting error, falling back locally:', err)
      return null
    }
  },

  /**
   * Update meeting / follow-up
   */
  async updateMeeting(id, updates) {
    try {
      const payload = {}
      if (updates.title !== undefined) payload.title = updates.title.trim()
      if (updates.contactName !== undefined) payload.contact_name = updates.contactName?.trim() || null
      if (updates.contactPhone !== undefined) payload.contact_phone = updates.contactPhone?.trim() || null
      if (updates.contactEmail !== undefined) payload.contact_email = updates.contactEmail?.trim() || null
      if (updates.contactRole !== undefined) payload.contact_role = updates.contactRole?.trim() || null
      if (updates.followupDate !== undefined) payload.followup_date = updates.followupDate
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.priority !== undefined) payload.priority = updates.priority
      if (updates.location !== undefined) payload.location = updates.location?.trim() || null
      if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null
      payload.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('meetings_followups')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.warn('MeetingService.updateMeeting error:', err)
      return null
    }
  },

  /**
   * Delete meeting
   */
  async deleteMeeting(id) {
    try {
      const { error } = await supabase
        .from('meetings_followups')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.warn('MeetingService.deleteMeeting error:', err)
      return false
    }
  },
}

