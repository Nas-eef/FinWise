import { supabase, handleSupabaseError } from '../lib/supabase'

export const SavingsService = {
  /**
   * Fetch all savings goals
   */
  async getSavingsGoals() {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount) || 0,
        currentAmount: Number(g.current_amount) || 0,
        targetDate: g.target_date,
        status: g.status,
        icon: g.icon || 'ShieldCheck',
        color: g.color || '#43845A',
        description: g.description,
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch savings goals')
    }
  },

  /**
   * Create savings goal
   */
  async createSavingsGoal(goalData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: user.id,
          name: goalData.name.trim(),
          description: goalData.description || null,
          target_amount: Number(goalData.targetAmount) || 0,
          current_amount: Number(goalData.currentAmount) || 0,
          target_date: goalData.targetDate || null,
          icon: goalData.icon || 'ShieldCheck',
          color: goalData.color || '#43845A',
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error
      return {
        id: data.id,
        name: data.name,
        targetAmount: Number(data.target_amount),
        currentAmount: Number(data.current_amount),
        targetDate: data.target_date,
        status: data.status,
      }
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create savings goal')
    }
  },

  /**
   * Add contribution (deposit or withdrawal) to savings goal
   */
  async contribute({ goalId, amount, type = 'deposit', accountId = null, notes = '' }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const numAmount = Number(amount)
      if (numAmount <= 0) throw new Error('Contribution amount must be positive')

      // Record contribution in savings_contributions
      const { error: contribError } = await supabase
        .from('savings_contributions')
        .insert({
          user_id: user.id,
          goal_id: goalId,
          account_id: accountId,
          amount: numAmount,
          contribution_type: type,
          notes,
        })

      if (contribError) throw contribError

      // Fetch current goal
      const { data: goal, error: goalFetchError } = await supabase
        .from('savings_goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single()

      if (goalFetchError) throw goalFetchError

      const prev = Number(goal.current_amount) || 0
      const nextAmount = type === 'deposit' ? prev + numAmount : Math.max(0, prev - numAmount)
      const isCompleted = nextAmount >= Number(goal.target_amount)

      const { data: updatedGoal, error: updateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: nextAmount,
          status: isCompleted ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single()

      if (updateError) throw updateError
      return updatedGoal
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to record contribution')
    }
  },

  /**
   * Delete savings goal
   */
  async deleteSavingsGoal(id) {
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete savings goal')
    }
  },
}

