import React, { useState } from 'react'
import { CategoryIcon } from '../../components/common/CategoryIcon'
import { GoalModal } from './GoalModal'
import { ContributeModal } from './ContributeModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Plus, CheckCircle, ShieldCheck, MoreVertical, Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export const Savings = () => {
  const savingsGoals = useFinanceStore((state) => state.savingsGoals)
  const deleteGoal = useFinanceStore((state) => state.deleteGoal)
  const user = useFinanceStore((state) => state.user)

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState(null)
  const [contributeGoal, setContributeGoal] = useState(null)
  const [goalToDelete, setGoalToDelete] = useState(null)

  const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0)
  const totalTarget = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0)
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div className="space-y-5 pb-20">
      {/* Total Savings Overview Card */}
      <div className="bg-forest text-white rounded-card-lg p-6 shadow-float relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-mint/15 rounded-full blur-xl" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-mint/80">
            Total Vault & Savings
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-mint/20 text-mint font-bold">
            {overallPercentage}% of all targets
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight mt-1">
          {formatCurrency(totalSaved, user?.currency)}
        </h1>
        <p className="text-xs text-mint/70 mt-1">
          Target across all goals: {formatCurrency(totalTarget, user?.currency)}
        </p>

        {/* Overall Progress */}
        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden p-0.5 mt-4">
          <div
            className="h-full bg-mint rounded-full transition-all duration-500"
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Goals List Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-forest">Savings Goals ({savingsGoals.length})</h3>
        <button
          onClick={() => {
            setGoalToEdit(null)
            setIsGoalModalOpen(true)
          }}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-forest text-white rounded-full shadow-subtle hover:bg-forest/90 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> New Goal
        </button>
      </div>

      {/* Goal Cards */}
      <div className="space-y-4">
        {savingsGoals.length === 0 ? (
          <div className="w-full p-8 text-center bg-white border border-brand-border/70 rounded-2xl space-y-1">
            <ShieldCheck className="w-8 h-8 text-sage mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-forest">No savings goals created</p>
            <p className="text-[11px] text-mutedgreen">
              Set emergency funds, vacation goals, or purchase targets to start saving.
            </p>
            <button
              onClick={() => {
                setGoalToEdit(null)
                setIsGoalModalOpen(true)
              }}
              className="mt-3 px-3.5 py-1.5 bg-forest text-mint text-xs font-bold rounded-xl shadow-sm"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          savingsGoals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0
          const isCompleted = goal.currentAmount >= goal.targetAmount
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)

          return (
            <div
              key={goal.id}
              className="p-5 bg-white border border-brand-border/80 rounded-card shadow-subtle hover:border-forest/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: goal.color || '#43845A' }}
                  >
                    <CategoryIcon name={goal.icon || 'ShieldCheck'} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-forest">{goal.name}</h4>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-brand-success border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-mutedgreen">
                      Target by {formatDate(goal.targetDate, 'short')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setGoalToEdit(goal)
                      setIsGoalModalOpen(true)
                    }}
                    className="p-1.5 text-mutedgreen hover:text-forest rounded-lg"
                    aria-label="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setGoalToDelete(goal)}
                    className="p-1.5 text-mutedgreen hover:text-brand-error rounded-lg"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 my-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-forest">
                    {formatCurrency(goal.currentAmount, user?.currency)}
                  </span>
                  <span className="text-mutedgreen">
                    {percentage}% of {formatCurrency(goal.targetAmount, user?.currency)}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-[#FAFBF9] border border-brand-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isCompleted ? '#43845A' : (goal.color || '#242E25')
                    }}
                  />
                </div>

                <p className="text-[11px] text-mutedgreen text-right">
                  {isCompleted ? 'Goal fully achieved!' : `${formatCurrency(remaining, user?.currency)} remaining`}
                </p>
              </div>

              {/* Action Buttons: Add Contribution / Withdraw */}
              <div className="flex items-center gap-2 pt-2 border-t border-brand-border/40">
                <button
                  onClick={() => setContributeGoal(goal)}
                  className="flex-1 py-2 px-3 bg-[#FAFBF9] hover:bg-mint/40 border border-brand-border rounded-xl text-xs font-bold text-forest flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 text-sage" /> Deposit / Withdraw
                </button>
              </div>
            </div>
          )
        }))}
      </div>

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false)
          setGoalToEdit(null)
        }}
        goalToEdit={goalToEdit}
      />

      <ContributeModal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
      />

      <ConfirmDialog
        isOpen={!!goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) deleteGoal(goalToDelete.id)
          setGoalToDelete(null)
        }}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete "${goalToDelete?.name}"?`}
      />
    </div>
  )
}

