import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinanceStore } from '../../store/useFinanceStore'
import { formatCurrency } from '../../utils/formatters'
import {
  Wallet, Sparkles, ArrowRight, ArrowLeft, Check, ShieldCheck,
  CreditCard, PieChart, CheckCircle2, ChevronRight
} from 'lucide-react'

export const Onboarding = () => {
  const navigate = useNavigate()
  const completeOnboarding = useFinanceStore((state) => state.completeOnboarding)
  const user = useFinanceStore((state) => state.user)
  const addAccount = useFinanceStore((state) => state.addAccount)
  const updateMonthlyBudgetLimit = useFinanceStore((state) => state.updateMonthlyBudgetLimit)
  const setCategoryBudget = useFinanceStore((state) => state.setCategoryBudget)

  const [step, setStep] = useState(1)

  // Step 2 Form
  const [name, setName] = useState(user.name || 'Alex Morgan')
  const [currency, setCurrency] = useState(user.currency || 'USD')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')

  // Step 3 Form (Initial Account)
  const [accName, setAccName] = useState('Checking Account')
  const [accType, setAccType] = useState('Bank')
  const [accBalance, setAccBalance] = useState('3500')

  // Step 4 Form (Monthly Budget)
  const [monthlyBudget, setMonthlyBudget] = useState('4500')

  // Step 5 Form (Category Budgets)
  const [catBudgets, setCatBudgets] = useState({
    'cat-food': '600',
    'cat-transport': '250',
    'cat-shopping': '400',
    'cat-bills': '350',
    'cat-entertainment': '200',
  })

  const nextStep = () => setStep(s => Math.min(6, s + 1))
  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const handleFinish = () => {
    // 1. Save user preferences
    completeOnboarding({ name, currency, monthlyBudget: parseFloat(monthlyBudget) || 4500 })

    // 2. Save initial account
    if (accName && accBalance) {
      addAccount({
        name: accName,
        type: accType,
        balance: parseFloat(accBalance) || 0,
        accountNumber: '****' + Math.floor(1000 + Math.random() * 9000),
        icon: accType === 'Cash' ? 'Wallet' : 'Landmark',
        color: '#242E25',
      })
    }

    // 3. Save category budgets
    Object.entries(catBudgets).forEach(([catId, val]) => {
      setCategoryBudget(catId, parseFloat(val) || 0)
    })

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white border border-brand-border/80 rounded-card-lg shadow-float p-6 sm:p-8 flex flex-col min-h-[520px]">
        {/* Progress Bar & Skip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-forest' : 'bg-brand-border'
                }`}
              />
            ))}
          </div>
          {step < 6 && (
            <button
              onClick={handleFinish}
              className="text-xs font-bold text-mutedgreen hover:text-forest transition-colors ml-4"
            >
              Skip Setup
            </button>
          )}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-forest text-mint mx-auto flex items-center justify-center shadow-subtle">
              <Sparkles className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-forest">Welcome to FinWise</h2>
              <p className="text-xs text-mutedgreen max-w-xs mx-auto leading-relaxed">
                Take full control of your income, expenses, savings targets, and loans with a minimalist green aesthetic.
              </p>
            </div>
            <div className="p-4 bg-[#FAFBF9] rounded-2xl border border-brand-border text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-forest font-semibold">
                <Check className="w-4 h-4 text-brand-success" /> Track multi-account balances & cash
              </div>
              <div className="flex items-center gap-2 text-forest font-semibold">
                <Check className="w-4 h-4 text-brand-success" /> Real-time category budget warning limits
              </div>
              <div className="flex items-center gap-2 text-forest font-semibold">
                <Check className="w-4 h-4 text-brand-success" /> Automated loan EMI & reminder tracking
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personal Preferences */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Step 2 of 6</span>
              <h2 className="text-xl font-black text-forest">Personal Preferences</h2>
              <p className="text-xs text-mutedgreen">How should we address you and format your amounts?</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Initial Account */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Step 3 of 6</span>
              <h2 className="text-xl font-black text-forest">Add Primary Account</h2>
              <p className="text-xs text-mutedgreen">Set up your main bank or cash balance</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Account Label</label>
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. Chase Checking, Cash Wallet"
                  className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value)}
                    className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                    <option value="Savings">Savings</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-mutedgreen uppercase tracking-wider mb-1">Opening Balance</label>
                  <input
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    className="w-full p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs font-bold text-forest outline-none focus:border-forest"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Monthly Budget */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-center space-y-4 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Step 4 of 6</span>
              <h2 className="text-xl font-black text-forest">Total Monthly Budget</h2>
              <p className="text-xs text-mutedgreen">How much do you plan to spend per month?</p>
            </div>

            <div className="p-4 bg-[#FAFBF9] rounded-2xl border border-brand-border">
              <span className="text-xs text-mutedgreen uppercase font-bold block mb-1">Monthly Spending Limit</span>
              <div className="flex items-center justify-center text-3xl font-black text-forest">
                <span className="mr-1">$</span>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-36 text-center bg-transparent outline-none border-b-2 border-forest"
                />
              </div>
              <p className="text-[11px] text-mutedgreen mt-2">
                We'll notify you whenever you cross 80% and 100% of this limit.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Category Budgets */}
        {step === 5 && (
          <div className="flex-1 flex flex-col justify-center space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Step 5 of 6</span>
              <h2 className="text-xl font-black text-forest">Category Allocations</h2>
              <p className="text-xs text-mutedgreen">Allocate portions of your monthly budget</p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {[
                { id: 'cat-food', label: 'Food & Dining' },
                { id: 'cat-transport', label: 'Transportation' },
                { id: 'cat-shopping', label: 'Shopping' },
                { id: 'cat-bills', label: 'Bills & Utilities' },
                { id: 'cat-entertainment', label: 'Entertainment' },
              ].map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-[#FAFBF9] border border-brand-border rounded-xl text-xs">
                  <span className="font-bold text-forest">{c.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-mutedgreen">$</span>
                    <input
                      type="number"
                      value={catBudgets[c.id]}
                      onChange={(e) => setCatBudgets({ ...catBudgets, [c.id]: e.target.value })}
                      className="w-20 p-1 text-right font-bold text-forest bg-white border border-brand-border rounded-lg outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Completion Screen */}
        {step === 6 && (
          <div className="flex-1 flex flex-col justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-mint text-forest mx-auto flex items-center justify-center shadow-subtle">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-forest">You're All Set!</h2>
              <p className="text-xs text-mutedgreen max-w-xs mx-auto leading-relaxed">
                Your accounts, currencies, and spending limits have been calibrated. Welcome to peaceful personal finance.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-brand-border/60 mt-auto">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="p-3 rounded-xl border border-brand-border text-forest hover:bg-[#FAFBF9] transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {step < 6 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 py-3 bg-forest hover:bg-forest/90 text-white font-bold rounded-xl shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check className="w-5 h-5" />
              <span>Go to My Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

