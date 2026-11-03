import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency, exportToCSV } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'
import { Download, Printer, TrendingUp, TrendingDown, PiggyBank, CreditCard, Inbox } from 'lucide-react'

export const Reports = () => {
  const transactions = useFinanceStore((state) => state.transactions)
  const categories = useFinanceStore((state) => state.categories)
  const accounts = useFinanceStore((state) => state.accounts)
  const user = useFinanceStore((state) => state.user)

  const [dateRange, setDateRange] = useState('this_month')

  const dateFilters = [
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'this_year', label: 'This Year' },
  ]

  // 1. Filter Transactions dynamically by selected Date Range
  const { filteredTransactions, daysCount } = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    let endDate = today

    if (dateRange === 'this_week') {
      const day = now.getDay() || 7 // Mon = 1, Sun = 7
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (dateRange === 'last_3_months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      startDate.setHours(0, 0, 0, 0)
    } else if (dateRange === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
    }

    const filtered = (transactions || []).filter((t) => {
      if (!t.date) return false
      const txDate = new Date(t.date)
      if (isNaN(txDate.getTime())) return false
      return txDate >= startDate && txDate <= endDate
    })

    const diffMs = Math.max(endDate.getTime() - startDate.getTime(), 86400000)
    const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))

    return { filteredTransactions: filtered, daysCount: days }
  }, [transactions, dateRange])

  // 2. Compute Real KPI Financial Metrics
  const { totalIncome, totalExpense, netSavings, savingsRate, dailyAverage } = useMemo(() => {
    let income = 0
    let expense = 0

    filteredTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0
      if (t.type === 'income' || t.type === 'refund') {
        income += amt
      } else if (t.type === 'expense') {
        expense += amt
      }
    })

    const net = Math.round((income - expense) * 100) / 100
    const rate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0
    const dailyAvg = daysCount > 0 ? Math.round((expense / daysCount) * 100) / 100 : 0

    return {
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      netSavings: net,
      savingsRate: rate,
      dailyAverage: dailyAvg,
    }
  }, [filteredTransactions, daysCount])

  // 3. Compute Real Historical Cash Flow Growth (Past 6 Calendar Months from real transactions)
  const monthlyCashflowData = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = d.getFullYear()
      const monthNum = String(d.getMonth() + 1).padStart(2, '0')
      const prefix = `${year}-${monthNum}`
      const monthLabel = d.toLocaleString('en-US', { month: 'short' })

      let inc = 0
      let exp = 0

      ;(transactions || []).forEach((t) => {
        if (t.date && t.date.startsWith(prefix)) {
          const amt = Number(t.amount) || 0
          if (t.type === 'income' || t.type === 'refund') inc += amt
          else if (t.type === 'expense') exp += amt
        }
      })

      months.push({
        month: monthLabel,
        income: Math.round(inc * 100) / 100,
        expense: Math.round(exp * 100) / 100,
        savings: Math.round((inc - exp) * 100) / 100,
      })
    }

    return months
  }, [transactions])

  // 4. Compute Real Category Expense Breakdown
  const categoryPieData = useMemo(() => {
    const totals = {}

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId)
        const name = cat?.name || t.category?.name || 'Other Expenses'
        const color = cat?.color || t.category?.color || '#7C827C'

        if (!totals[name]) {
          totals[name] = { name, value: 0, color }
        }
        totals[name].value += Number(t.amount) || 0
      })

    return Object.values(totals)
      .map((item) => ({ ...item, value: Math.round(item.value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
  }, [filteredTransactions, categories])

  // 5. Compute Real Account Balance Distribution
  const accountBarData = useMemo(() => {
    return (accounts || []).map((a) => ({
      name: a.name ? a.name.split(' ')[0] : 'Account',
      fullName: a.name || 'Account',
      balance: Math.max(0, Number(a.balance) || 0),
    }))
  }, [accounts])

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹'

  const handleExportCSV = () => {
    const csvData = filteredTransactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Description: t.description,
      Amount: t.amount,
      Category: categories.find((c) => c.id === t.categoryId)?.name || t.category?.name || 'Other',
      PaymentMethod: t.paymentMethod || 'Card',
    }))
    exportToCSV(csvData, `FinWise_Report_${dateRange}.csv`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-5 pb-20 print:p-4">
      {/* Top Header & Export Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {dateFilters.map((d) => (
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

      {/* KPI Cards Grid (Computed from Database) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-brand-success flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Total Inflow</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(totalIncome, user?.currency)}
          </h3>
          <span className="text-[10px] text-mutedgreen font-medium">Real cashflow received</span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-brand-error flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Total Outflow</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(totalExpense, user?.currency)}
          </h3>
          <span className="text-[10px] text-mutedgreen font-medium">Real expense outflow</span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-mint/50 text-forest flex items-center justify-center mb-2">
            <PiggyBank className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Savings Rate</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {savingsRate}%
          </h3>
          <span className="text-[10px] text-mutedgreen">
            Net: {formatCurrency(netSavings, user?.currency)}
          </span>
        </div>

        <div className="p-4 bg-white border border-brand-border/70 rounded-card shadow-subtle">
          <div className="w-8 h-8 rounded-xl bg-[#FAFBF9] border border-brand-border text-forest flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-mutedgreen">Daily Average</span>
          <h3 className="text-lg font-black text-forest mt-0.5">
            {formatCurrency(dailyAverage, user?.currency)}
          </h3>
          <span className="text-[10px] text-mutedgreen">Across {daysCount} days</span>
        </div>
      </div>

      {/* Chart 1: Dynamic Cash Flow Growth (Last 6 Months from Supabase DB) */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-mutedgreen">Historical 6 Months</span>
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
                  <stop offset="5%" stopColor="#8AAB8F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8AAB8F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#242E25" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#242E25" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#7C827C', fontSize: 10 }}
                tickFormatter={(v) => (v >= 1000 ? `${currencySymbol}${Math.round(v / 1000)}k` : `${currencySymbol}${v}`)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value) || 0, user?.currency), '']}
              />
              <Area type="monotone" dataKey="income" stroke="#8AAB8F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#242E25" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Breakdown from Database */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <h3 className="text-base font-bold text-forest mb-3">Category-Wise Breakdown</h3>
        {categoryPieData.length === 0 ? (
          <div className="py-8 text-center text-mutedgreen">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-mutedgreen" />
            <p className="text-xs font-semibold">No expense records found for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryPieData.slice(0, 8).map((cat) => {
              const pct = totalExpense > 0 ? Math.round((cat.value / totalExpense) * 100) : 0
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-forest flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-extrabold text-forest">
                      {formatCurrency(cat.value, user?.currency)}{' '}
                      <span className="text-[11px] font-normal text-mutedgreen">({pct}%)</span>
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
        )}
      </div>

      {/* Chart 3: Real Account Balance Distribution from Database */}
      <div className="p-5 bg-white border border-brand-border/70 rounded-card shadow-subtle">
        <h3 className="text-base font-bold text-forest mb-3">Balance Distribution by Account</h3>
        {accountBarData.length === 0 ? (
          <div className="py-8 text-center text-mutedgreen">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40 text-mutedgreen" />
            <p className="text-xs font-semibold">No accounts found</p>
          </div>
        ) : (
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountBarData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7C827C', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#7C827C', fontSize: 10 }}
                  tickFormatter={(v) => (v >= 1000 ? `${currencySymbol}${Math.round(v / 1000)}k` : `${currencySymbol}${v}`)}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value) || 0, user?.currency), 'Balance']}
                />
                <Bar dataKey="balance" fill="#8AAB8F" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
