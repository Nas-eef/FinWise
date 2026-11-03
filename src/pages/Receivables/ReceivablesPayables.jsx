import React, { useState } from 'react'
import { DebtModal } from './DebtModal'
import { DebtPaymentModal } from './DebtPaymentModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export const ReceivablesPayables = () => {
  const debts = useFinanceStore((state) => state.debts)
  const deleteDebt = useFinanceStore((state) => state.deleteDebt)
  const user = useFinanceStore((state) => state.user)

  const [activeTab, setActiveTab] = useState('receivable')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [paymentDebt, setPaymentDebt] = useState(null)
  const [debtToDelete, setDebtToDelete] = useState(null)
  const [expandedDebtId, setExpandedDebtId] = useState(null)

  const receivables = debts.filter(d => d.type === 'receivable')
  const payables = debts.filter(d => d.type === 'payable')

  const totalReceivable = receivables.reduce((sum, d) => sum + Math.max(0, d.amount - d.paidAmount), 0)
  const totalPayable = payables.reduce((sum, d) => sum + Math.max(0, d.amount - d.paidAmount), 0)
  const netBalance = totalReceivable - totalPayable

  const currentList = activeTab === 'receivable' ? receivables : payables

  return (
    <div className="space-y-5 pb-20">
      {/* Banner */}
      <div className="bg-forest text-white rounded-card-lg p-6 shadow-float relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-sage/20 rounded-full blur-xl" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-mint/80 block mb-1">
          Net Owed Balance
        </span>
        <h1 className="text-3xl font-black tracking-tight">
          {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, user?.currency)}
        </h1>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
          <div>
            <p className="text-mint/70 uppercase text-[10px] font-bold">To Receive (Others owe you)</p>
            <p className="text-sm font-bold text-mint mt-0.5">
              +{formatCurrency(totalReceivable, user?.currency)}
            </p>
          </div>
          <div>
            <p className="text-mint/70 uppercase text-[10px] font-bold">To Pay (You owe others)</p>
            <p className="text-sm font-bold text-[#FF8A80] mt-0.5">
              -{formatCurrency(totalPayable, user?.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 p-1 bg-white border border-brand-border rounded-2xl flex text-xs">
          <button
            onClick={() => setActiveTab('receivable')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'receivable'
                ? 'bg-forest text-white shadow-subtle'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Receivables ({receivables.length})
          </button>
          <button
            onClick={() => setActiveTab('payable')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${
              activeTab === 'payable'
                ? 'bg-forest text-white shadow-subtle'
                : 'text-mutedgreen hover:text-forest'
            }`}
          >
            Payables ({payables.length})
          </button>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="p-2.5 bg-forest hover:bg-forest/90 text-white rounded-2xl shadow-subtle active:scale-95 transition-all flex items-center justify-center shrink-0"
          aria-label="Add entry"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="w-full p-8 text-center bg-white border border-brand-border/70 rounded-2xl space-y-1">
            <Clock className="w-8 h-8 text-sage mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-forest">
              No {activeTab === 'receivable' ? 'receivables' : 'payables'} recorded
            </p>
            <p className="text-[11px] text-mutedgreen">
              {activeTab === 'receivable'
                ? 'Record money lent to friends or pending payments from clients.'
                : 'Record money borrowed or payments you need to settle.'}
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-3 px-3.5 py-1.5 bg-forest text-mint text-xs font-bold rounded-xl shadow-sm"
            >
              Add Entry
            </button>
          </div>
        ) : (
          currentList.map((item) => {
          const outstanding = Math.max(0, item.amount - item.paidAmount)
          const isSettled = item.status === 'settled' || outstanding === 0
          const isExpanded = expandedDebtId === item.id

          return (
            <div
              key={item.id}
              className={`bg-white border rounded-card shadow-subtle transition-all overflow-hidden ${
                isSettled ? 'border-brand-border/40 opacity-75' : 'border-brand-border/80'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      item.type === 'receivable' ? 'bg-emerald-50 text-brand-success' : 'bg-red-50 text-brand-error'
                    }`}>
                      {item.type === 'receivable' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-forest">{item.personName}</h4>
                      <p className="text-xs text-mutedgreen">{item.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-forest">
                      {formatCurrency(outstanding, user?.currency)}
                    </p>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      isSettled
                        ? 'bg-emerald-50 text-brand-success'
                        : item.status === 'partial'
                        ? 'bg-amber-50 text-brand-warning'
                        : 'bg-[#FAFBF9] border border-brand-border text-mutedgreen'
                    }`}>
                      {isSettled ? 'Settled' : item.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-mutedgreen py-2 border-t border-brand-border/40">
                  <span>Total: {formatCurrency(item.amount, user?.currency)} (Paid: {formatCurrency(item.paidAmount, user?.currency)})</span>
                  <span>Due {formatDate(item.dueDate, 'short')}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-brand-border/40">
                  {!isSettled && (
                    <button
                      onClick={() => setPaymentDebt(item)}
                      className="flex-1 py-1.5 px-3 bg-forest hover:bg-forest/90 text-white rounded-xl text-xs font-bold transition-colors active:scale-98"
                    >
                      Record Payment
                    </button>
                  )}

                  {item.history && item.history.length > 0 && (
                    <button
                      onClick={() => setExpandedDebtId(isExpanded ? null : item.id)}
                      className="py-1.5 px-3 bg-[#FAFBF9] hover:bg-mint/40 border border-brand-border rounded-xl text-xs font-semibold text-forest flex items-center gap-1 transition-colors"
                    >
                      <span>History ({item.history.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => setDebtToDelete(item)}
                    className="p-1.5 text-mutedgreen hover:text-brand-error transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Partial payment history breakdown */}
              {isExpanded && item.history && (
                <div className="bg-[#FAFBF9] border-t border-brand-border/60 p-3 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen block">
                    Settlement Log
                  </span>
                  {item.history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-brand-border/40">
                      <div>
                        <span className="font-bold text-forest">{formatCurrency(h.amount, user?.currency)}</span>
                        <span className="text-mutedgreen ml-2">({h.note})</span>
                      </div>
                      <span className="text-mutedgreen text-[11px]">{formatDate(h.date, 'short')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }))}
      </div>

      {/* Modals */}
      <DebtModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        defaultType={activeTab}
      />

      <DebtPaymentModal
        isOpen={!!paymentDebt}
        onClose={() => setPaymentDebt(null)}
        debt={paymentDebt}
      />

      <ConfirmDialog
        isOpen={!!debtToDelete}
        onClose={() => setDebtToDelete(null)}
        onConfirm={() => {
          if (debtToDelete) deleteDebt(debtToDelete.id)
          setDebtToDelete(null)
        }}
        title="Delete Record"
        message={`Are you sure you want to delete the record for ${debtToDelete?.personName}?`}
      />
    </div>
  )
}

