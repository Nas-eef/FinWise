import { supabase, handleSupabaseError } from '../lib/supabase'

export const FriendNotesService = {
  /**
   * Fetch all friend notes (both Receivables and Payables)
   */
  async getNotes() {
    try {
      const [recRes, payRes] = await Promise.all([
        supabase.from('receivables').select('*').order('created_at', { ascending: false }),
        supabase.from('payables').select('*').order('created_at', { ascending: false }),
      ])

      if (recRes.error) throw recRes.error
      if (payRes.error) throw payRes.error

      const receivables = (recRes.data || []).map((r) => ({
        id: r.id,
        type: 'to_get',
        personName: r.person_name,
        amount: Number(r.amount) || 0,
        paidAmount: Number(r.amount_received) || 0,
        dueDate: r.due_date,
        note: r.description,
        isSettled: r.status === 'settled',
        table: 'receivables',
      }))

      const payables = (payRes.data || []).map((p) => ({
        id: p.id,
        type: 'to_pay',
        personName: p.person_name,
        amount: Number(p.amount) || 0,
        paidAmount: Number(p.amount_paid) || 0,
        dueDate: p.due_date,
        note: p.description,
        isSettled: p.status === 'settled',
        table: 'payables',
      }))

      return [...receivables, ...payables]
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch friend notes')
    }
  },

  /**
   * Create a new Friend Note (Receivable or Payable)
   */
  async createNote(item) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const isToGet = item.type === 'to_get'
      const targetTable = isToGet ? 'receivables' : 'payables'

      const payload = {
        user_id: user.id,
        person_name: item.personName.trim(),
        amount: Number(item.amount) || 0,
        due_date: item.dueDate || null,
        description: item.note || '',
        status: 'pending',
      }

      if (isToGet) {
        payload.amount_received = 0
      } else {
        payload.amount_paid = 0
      }

      const { data, error } = await supabase
        .from(targetTable)
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        type: isToGet ? 'to_get' : 'to_pay',
        personName: data.person_name,
        amount: Number(data.amount),
        paidAmount: 0,
        dueDate: data.due_date,
        note: data.description,
        isSettled: false,
        table: targetTable,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create friend note')
    }
  },

  /**
   * Record a payment (partial or full) for a friend note
   */
  async recordPayment(id, type, amountPaid) {
    try {
      const isToGet = type === 'to_get'
      const targetTable = isToGet ? 'receivables' : 'payables'
      const paidCol = isToGet ? 'amount_received' : 'amount_paid'

      const { data: current, error: fetchErr } = await supabase
        .from(targetTable)
        .select('amount, ' + paidCol)
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      const num = Number(amountPaid) || 0
      const currentPaid = Number(current[paidCol]) || 0
      const newPaid = currentPaid + num
      const totalAmount = Number(current.amount) || 0
      const isSettled = newPaid >= totalAmount

      const { data, error: updateErr } = await supabase
        .from(targetTable)
        .update({
          [paidCol]: newPaid,
          status: isSettled ? 'settled' : 'partial',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateErr) throw updateErr
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to record friend payment')
    }
  },

  /**
   * Toggle settled state
   */
  async toggleSettled(id, type, nextSettled) {
    try {
      const isToGet = type === 'to_get'
      const targetTable = isToGet ? 'receivables' : 'payables'
      const paidCol = isToGet ? 'amount_received' : 'amount_paid'

      const { data: current, error: fetchErr } = await supabase
        .from(targetTable)
        .select('amount')
        .eq('id', id)
        .single()

      if (fetchErr) throw fetchErr

      const total = Number(current.amount) || 0
      const payload = {
        status: nextSettled ? 'settled' : 'pending',
        [paidCol]: nextSettled ? total : 0,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from(targetTable)
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update settled state')
    }
  },

  /**
   * Update existing friend note
   */
  async updateNote(id, type, updates) {
    try {
      const isToGet = type === 'to_get'
      const targetTable = isToGet ? 'receivables' : 'payables'

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (updates.personName) payload.person_name = updates.personName.trim()
      if (updates.amount !== undefined) payload.amount = Number(updates.amount)
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate || null
      if (updates.note !== undefined) payload.description = updates.note

      const { data, error } = await supabase
        .from(targetTable)
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to update friend note')
    }
  },

  /**
   * Delete friend note
   */
  async deleteNote(id, type) {
    try {
      const targetTable = type === 'to_get' ? 'receivables' : 'payables'
      const { error } = await supabase.from(targetTable).delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete friend note')
    }
  },
}
