import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinanceStore } from '../../store/useFinanceStore'

export const CategoryPieChart = () => {
  const categories = useFinanceStore((state) => state.categories)
  const transactions = useFinanceStore((state) => state.transactions)
  const user = useFinanceStore((state) => state.user)

  // Aggregate current month expense by category
  const expenseTransactions = transactions.filter(t => t.type === 'expense')

  const categoryTotals = {}
  expenseTransactions.forEach(t => {
    const catId = t.categoryId || 'cat-other-exp'
    categoryTotals[catId] = (categoryTotals[catId] || 0) + Number(t.amount || 0)
  })

  const data = Object.entries(categoryTotals)
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId)
      return {
        name: cat?.name || 'Other',
        value: amount,
        color: cat?.color || '#8AAB8F',
      }
    })
    .sort((a, b) => b.value - a.value)

  const topCategories = data.slice(0, 4)
  const otherTotal = data.slice(4).reduce((sum, item) => sum + item.value, 0)
  if (otherTotal > 0) {
    topCategories.push({ name: 'Others', value: otherTotal, color: '#7C827C' })
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="bg-forest text-white p-2.5 rounded-xl text-xs shadow-float border border-white/10">
          <p className="font-bold">{item.name}</p>
          <p className="text-mint font-semibold mt-0.5">{formatCurrency(item.value, user?.currency)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="w-36 h-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={topCategories}
              innerRadius={38}
              outerRadius={56}
              paddingAngle={3}
              dataKey="value"
            >
              {topCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {topCategories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-forest font-medium truncate">{cat.name}</span>
            </div>
            <span className="font-bold text-forest shrink-0">
              {formatCurrency(cat.value, user?.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

