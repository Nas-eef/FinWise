import React, { useState } from 'react'
import { LoanModal } from './LoanModal'
import { EmiPaymentModal } from './EmiPaymentModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Landmark, Plus, Bell, CheckCircle, CreditCard, Trash2, Calendar, AlertCircle } from 'lucide-react'

export const Loans = () => {
  const loans = useFinanceStore((state) => state.loans)
  const deleteLoan = useFinanceStore((state) => state.deleteLoan)
  const user = useFinanceStore((state) => state.user)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedLoanForEmi, setSelectedLoanForEmi] = useState(null)
  const [loanToDelete, setLoanToDelete] = useState(null)

  const totalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0)
  const totalMonthlyEmi = loans.reduce((sum, l) => sum + (l.emiAmount || 0), 0)

  // Get 1-day before notification string
  const get1DayAlert = (dueDate) => {
    if (!dueDate) return ''
    const d = new Date(dueDate)
    d.setDate(d.getDate() - 1)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Overview Banner */}
      <div className="bg-forest text-white rounded-card-lg p-5 shadow-float relative overflow-hidden">
        <span className="text-[10px] font-bold uppercase tracking-widest text-mint/80 block mb-1">
          Loans & EMI Liability
        </span>
        <h1 className="text-3xl font-black tracking-tight">
          {formatCurrency(totalOutstanding, user?.currency)}
        </h1>

        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <p className="text-mint/70 uppercase text-[10px] font-bold">Monthly EMI Commitment</p>
            <p className="text-base font-extrabold text-white mt-0.5">
              {formatCurrency(totalMonthlyEmi, user?.currency)}
            </p>
          </div>
          <div>
            <p className="text-mint/70 uppercase text-[10px] font-bold">Push Notifications</p>
            <p className="text-xs font-bold text-mint mt-1 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" /> 1 Day Before Due
            </p>
          </div>
        </div>
      </div>

      {/* Push Notification Callout Banner */}
      <div className="p-3 bg-white border border-brand-border/80 rounded-2xl flex items-center gap-2.5 shadow-subtle">
        <div className="w-8 h-8 rounded-full bg-mint/50 flex items-center justify-center text-forest shrink-0">
          <Bell className="w-4 h-4 text-forest" />
        </div>
        <p className="text-xs text-forest font-semibold leading-snug">
          <strong>1-Day Pre-Due Alerts:</strong> We send push notifications exactly 1 day before your EMI is due.
        </p>
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-extrabold text-forest">Active Loans ({loans.length})</h3>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-forest text-white rounded-full shadow-subtle hover:bg-forest/90 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> New Loan
        </button>
      </div>

      {/* Loan Cards */}
      <div className="space-y-3">
        {loans.length === 0 ? (
          <div className="p-6 bg-white border border-brand-border/70 rounded-2xl text-center space-y-1.5">
            <p className="text-xs font-bold text-forest">No active loans or EMIs</p>
            <p className="text-[11px] text-mutedgreen">
              Add a loan to calculate monthly EMIs and receive 1-day prior alert notifications.
            </p>
          </div>
        ) : (
          loans.map((loan) => {

          const repaidAmount = Math.max(0, loan.originalAmount - loan.outstandingAmount)
          const progressPercent = Math.min(100, Math.round((repaidAmount / loan.originalAmount) * 100))

          return (
            <div
              key={loan.id}
              className="p-4 bg-white border border-brand-border/80 rounded-card shadow-subtle space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-mint/40 flex items-center justify-center text-forest">
                    <Landmark className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-forest">{loan.name}</h4>
                    <p className="text-xs text-mutedgreen">{loan.lender}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-forest">
                    {formatCurrency(loan.emiAmount, user?.currency)}
                  </span>
                  <span className="block text-[10px] text-mutedgreen uppercase font-semibold">
                    Monthly EMI
                  </span>
                </div>
              </div>

              {/* 1-Day Notification Badge */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAFBF9] border border-brand-border/60 text-xs">
                <span className="text-mutedgreen flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-forest" />
                  Due: <strong className="text-forest">{formatDate(loan.dueDate, 'short')}</strong>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-forest bg-mint/50 px-2 py-0.5 rounded-md">
                  <Bell className="w-3 h-3 text-forest" />
                  Alert: {get1DayAlert(loan.dueDate)} (1-day prior)
                </span>
              </div>

              {/* Repayment Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mutedgreen">
                    Outstanding: <strong className="text-forest font-bold">{formatCurrency(loan.outstandingAmount, user?.currency)}</strong>
                  </span>
                  <span className="text-forest font-bold">{progressPercent}% Paid</span>
                </div>
                <div className="w-full h-2 bg-[#FAFBF9] border border-brand-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-brand-border/40">
                <button
                  onClick={() => setSelectedLoanForEmi(loan)}
                  className="flex-1 py-2 px-3 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-subtle active:scale-98 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay EMI
                </button>

                <button
                  onClick={() => setLoanToDelete(loan)}
                  className="p-2 text-mutedgreen hover:text-brand-error rounded-xl transition-colors"
                  title="Delete Loan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })
      )}
      </div>


      {/* Modals */}
      <LoanModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <EmiPaymentModal
        isOpen={!!selectedLoanForEmi}
        onClose={() => setSelectedLoanForEmi(null)}
        loan={selectedLoanForEmi}
      />

      <ConfirmDialog
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={() => {
          if (loanToDelete) deleteLoan(loanToDelete.id)
          setLoanToDelete(null)
        }}
        title="Delete Loan Record"
        message={`Are you sure you want to remove "${loanToDelete?.name}"?`}
      />
    </div>
  )
}
