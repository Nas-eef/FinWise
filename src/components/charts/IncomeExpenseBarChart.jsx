import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'

export const IncomeExpenseBarChart = () => {
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  // Aggregate by last 5 months
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov']
  const mockMonthlyData = [
    { month: 'Jul', income: 4800, expense: 3200 },
    { month: 'Aug', income: 5100, expense: 3850 },
    { month: 'Sep', income: 4950, expense: 2900 },
    { month: 'Oct', income: 5600, expense: 3410 },
    { month: 'Nov', income: 5200, expense: 1681 },
  ]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-forest text-white p-3 rounded-xl shadow-float text-xs border border-white/10">
          <p className="font-bold mb-1 text-mint">{label} 2026</p>
          <div className="space-y-1">
            <p className="flex items-center justify-between gap-4">
              <span className="text-mint">Income:</span>
              <span className="font-bold">{formatCurrency(payload[0]?.value, user?.currency)}</span>
            </p>
            <p className="flex items-center justify-between gap-4">
              <span className="text-white/80">Expense:</span>
              <span className="font-bold">{formatCurrency(payload[1]?.value, user?.currency)}</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mockMonthlyData} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7C827C', fontSize: 11, fontWeight: 500 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7C827C', fontSize: 10 }}
            tickFormatter={(val) => `$${val / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="income"
            name="Income"
            fill="#8AAB8F"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill="#242E25"
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

