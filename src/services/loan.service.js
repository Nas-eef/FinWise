import { supabase, handleSupabaseError } from '../lib/supabase'

export const LoanService = {
  /**
   * Fetch all user's loans with upcoming installment schedules
   */
  async getLoans() {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          installments:loan_installments(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((l) => ({
        id: l.id,
        name: l.loan_name,
        lender: l.lender_name,
        originalAmount: Number(l.principal_amount) || 0,
        outstandingAmount: Number(l.outstanding_principal) || 0,
        interestRate: Number(l.annual_interest_rate) || 0,
        interestMethod: l.interest_method,
        tenureMonths: l.tenure_months,
        emiAmount: Number(l.emi_amount) || 0,
        startDate: l.start_date,
        dueDate: l.next_due_date,
        pushNotification1DayBefore: l.push_notification_1_day_before,
        status: l.status,
        schedule: (l.installments || [])
          .sort((a, b) => a.installment_number - b.installment_number)
          .map((inst) => ({
            month: `Installment #${inst.installment_number}`,
            emi: Number(inst.total_emi),
            principal: Number(inst.principal_amount),
            interest: Number(inst.interest_amount),
            status: inst.payment_status,
            date: inst.due_date,
          })),
      }))
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to fetch loans')
    }
  },

  /**
   * Create a new loan with auto-calculated installment schedule
   */
  async createLoan(loanData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const principal = Number(loanData.principalAmount || loanData.originalAmount)
      const interestRate = Number(loanData.annualInterestRate || loanData.interestRate || 0)
      const tenure = Number(loanData.tenureMonths || 12)
      const emi = Number(loanData.emiAmount || 0)
      const dueDate = loanData.dueDate || loanData.nextDueDate || '2026-11-15'

      const { data: loan, error } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          loan_name: loanData.name || loanData.loanName || 'Personal Loan',
          lender_name: loanData.lender || loanData.lenderName || 'Bank',
          principal_amount: principal,
          outstanding_principal: principal,
          annual_interest_rate: interestRate,
          tenure_months: tenure,
          emi_amount: emi,
          start_date: loanData.startDate || new Date().toISOString().split('T')[0],
          next_due_date: dueDate,
          push_notification_1_day_before: true,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      // Generate initial installment entries in loan_installments
      const installments = []
      let d = new Date(dueDate)
      for (let i = 1; i <= Math.min(tenure, 36); i++) {
        installments.push({
          user_id: user.id,
          loan_id: loan.id,
          installment_number: i,
          due_date: d.toISOString().split('T')[0],
          total_emi: emi,
          payment_status: i === 1 ? 'upcoming' : 'upcoming',
        })
        d.setMonth(d.getMonth() + 1)
      }

      await supabase.from('loan_installments').insert(installments)

      return loan
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to create loan')
    }
  },

  /**
   * Record EMI Payment against loan
   */
  async recordPayment(loanId, emiAmount, accountId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const num = Number(emiAmount) || 0

      // Insert record in loan_payments
      await supabase.from('loan_payments').insert({
        user_id: user.id,
        loan_id: loanId,
        account_id: accountId,
        amount: num,
        payment_date: new Date().toISOString().split('T')[0],
      })

      // Fetch loan to update outstanding balance
      const { data: loan } = await supabase
        .from('loans')
        .select('outstanding_principal, loan_name')
        .eq('id', loanId)
        .single()

      if (loan) {
        const nextBal = Math.max(0, (Number(loan.outstanding_principal) || 0) - num)
        await supabase
          .from('loans')
          .update({
            outstanding_principal: nextBal,
            status: nextBal === 0 ? 'closed' : 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', loanId)
      }

      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to record EMI payment')
    }
  },

  /**
   * Delete loan
   */
  async deleteLoan(id) {
    try {
      const { error } = await supabase.from('loans').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      throw handleSupabaseError(err, 'Failed to delete loan')
    }
  },
}
