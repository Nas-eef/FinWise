import React, { useState } from 'react'
import {
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency, exportToCSV } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Download, Printer, TrendingUp, TrendingDown, PiggyBank, CreditCard, ChevronRight } from 'lucide-react'

export const Reports = () => {
  const transactions = useFinanceStore((state) => state.transactions)
  const categories = useFinanceStore((state) => state.categories)
  const accounts = useFinanceStore((state) => state.accounts)
  const user = useFinanceStore((state) => state.user)

  const [dateRange, setDateRange] = useState('this_month')
  const [activeTab, setActiveTab] = useState('overview')

  const dateFilters = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'this_year', label: 'This Year' },
  ]

  // Monthly Trend Data
  const monthlyCashflowData = [
    { month: 'Jun', income: 4500, expense: 3100, savings: 1400 },
    { month: 'Jul', income: 4800, expense: 3200, savings: 1600 },
    { month: 'Aug', income: 5100, expense: 3850, savings: 1250 },
    { month: 'Sep', income: 4950, expense: 2900, savings: 2050 },
    { month: 'Oct', income: 5600, expense: 3410, savings: 2190 },
    { month: 'Nov', income: 5200, expense: 1681, savings: 3519 },
  ]

  // Weekly Trend Data
  const weeklyData = [
    { day: 'Mon', amount: 45 },
    { day: 'Tue', amount: 120 },
    { day: 'Wed', amount: 86 },
    { day: 'Thu', amount: 35 },
    { day: 'Fri', amount: 210 },
    { day: 'Sat', amount: 140 },
    { day: 'Sun', amount: 65 },
  ]

  // Category Expense Breakdown
  const categoryTotals = {}
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId)
    const name = cat?.name || 'Other'
    categoryTotals[name] = (categoryTotals[name] || 0) + Number(t.amount || 0)
  })

  const categoryPieData = Object.entries(categoryTotals).map(([name, value]) => {
    const cat = categories.find(c => c.name === name)
    return { name, value, color: cat?.color || '#8AAB8F' }
  }).sort((a, b) => b.value - a.value)

  // Account Distribution
  const accountBarData = accounts.map(a => ({
    name: a.name.split(' ')[0],
    balance: a.balance,
  }))

  const totalIncome = 5200
  const totalExpense = 1681.40
  const netSavings = totalIncome - totalExpense
  const savingsRate = Math.round((netSavings / totalIncome) * 100)

  const handleExportCSV = () => {
    const csvData = transactions.map(t => ({
      Date: t.date,
      Type: t.type,
      Description: t.description,
      Amount: t.amount,
      PaymentMethod: t.paymentMethod,
    }))
    exportToCSV(csvData, 'Financial_Report_Export.csv')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-5 pb-20 print:p-4">
      {/* Top Header & Export Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {dateFilters.map(d => (
            <button
              key={d.id}
              onClick={() => setDateRange(d.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                dateRange === d.id
                  ? 'bg-forest text-white shadow-subtle'
                  : 'bg-white border border-brand-border text-forest hover:bg-mint/30'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={handleExportCSV}
            className="p-2 bg-white border border-brand-border rounded-full text-forest hover:bg-[#FAFBF9] shadow-subtle"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-white border border-brand-border rounded-full text-forest hover:bg-[#FAFBF9] shadow-subtle"
            title="Print / Save PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-brand-success flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Total Inflow</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(totalIncome, user?.currency)}
          </h3>
          <span className="text-[10px] text-brand-success font-semibold">+12% vs last month</span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-brand-error flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Total Outflow</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(totalExpense, user?.currency)}
          </h3>
          <span className="text-[10px] text-brand-success font-semibold">-8% vs last month</span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-mint/50 text-forest flex items-center justify-center mb-2">
            <PiggyBank className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Savings Rate</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {savingsRate}%
          </h3>
          <span className="text-[10px] text-mutedgreen">High saving surplus</span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-[#FAFBF9] border border-brand-border text-forest flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Daily Average</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(56.05, user?.currency)}
          </h3>
          <span className="text-[10px] text-mutedgreen">Well within limit</span>
        </div>
      </div>

      {/* Chart 1: Income vs Expense Trend */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Historical</span>
            <h3 className="text-base font-bold text-forest">Cash Flow Growth</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-forest font-semibold">
              <span className="w-2 h-2 rounded-full bg-sage" /> Income
            </span>
            <span className="flex items-center gap-1 text-forest font-semibold">
              <span className="w-2 h-2 rounded-full bg-forest" /> Expense
            </span>
          </div>
        </div>

        <div className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyCashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8AAB8F" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8AAB8F" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#242E25" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#242E25" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip formatter={(value) => [`$${value}`, '']} />
              <Area type="monotone" dataKey="income" stroke="#8AAB8F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#242E25" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Breakdown */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <h3 className="text-base font-bold text-forest mb-3">Category-Wise Breakdown</h3>
        <div className="space-y-3">
          {categoryPieData.slice(0, 6).map((cat) => {
            const pct = Math.round((cat.value / totalExpense) * 100) || 0
            return (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-forest flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="font-extrabold text-forest">
                    {formatCurrency(cat.value, user?.currency)} <span className="text-[11px] font-normal text-mutedgreen">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#FAFBF9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Chart 3: Account Balance Distribution */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <h3 className="text-base font-bold text-forest mb-3">Balance Distribution by Account</h3>
        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accountBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 10 }} tickFormatter={v => `$${v/1000}k`} />
              <Tooltip formatter={(value) => [`$${value}`, 'Balance']} />
              <Bar dataKey="balance" fill="#8AAB8F" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

