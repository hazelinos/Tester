import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import MonthSelector from '../components/MonthSelector';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-text-secondary font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Report() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { getMonthlyIncome, getMonthlyExpense, getExpenseByCategory, getLast6MonthsData } = useFinance();

  const income    = useMemo(() => getMonthlyIncome(selectedDate),    [getMonthlyIncome, selectedDate]);
  const expense   = useMemo(() => getMonthlyExpense(selectedDate),   [getMonthlyExpense, selectedDate]);
  const expByCat  = useMemo(() => getExpenseByCategory(selectedDate), [getExpenseByCategory, selectedDate]);
  const last6     = useMemo(() => getLast6MonthsData(),               [getLast6MonthsData]);

  const savings     = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  // Bar chart data
  const barData = last6.map((d) => ({
    name: getMonthName(d.month).substring(0, 3),
    Pemasukan: d.income,
    Pengeluaran: d.expense,
  }));

  // Pie/category data
  const catData = useMemo(() =>
    Object.entries(expByCat)
      .map(([id, amount]) => ({ ...getCategoryById(id), amount, value: amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    [expByCat]
  );
  const totalExpense = catData.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Laporan</h1>
        <MonthSelector date={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pemasukan',   val: income,   color: '#A8E6CF', bg: 'bg-income/10'  },
          { label: 'Pengeluaran', val: expense,  color: '#FF6B6B', bg: 'bg-expense/10' },
          { label: savings >= 0 ? 'Tabungan' : 'Defisit', val: Math.abs(savings), color: savings >= 0 ? '#A8E6CF' : '#FF6B6B', bg: savings >= 0 ? 'bg-income/10' : 'bg-expense/10' },
        ].map((s) => (
          <div key={s.label} className="card text-center space-y-2">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{formatCurrency(s.val)}</p>
          </div>
        ))}
      </div>

      {/* Savings rate */}
      {income > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">
              {savings >= 0 ? '💰 Tingkat Tabungan' : '⚠️ Tingkat Defisit'}
            </span>
            <span className={clsx('text-sm font-bold', savings >= 0 ? 'text-income' : 'text-expense')}>
              {Math.abs(savingsRate)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }}
            />
          </div>
          <p className="text-xs text-text-muted">
            {savings >= 0
              ? `${savingsRate}% dari pemasukan berhasil ditabung bulan ini`
              : `Pengeluaran melebihi pemasukan sebesar ${Math.abs(savingsRate)}%`}
          </p>
        </div>
      )}

      {/* ── Bar Chart 6 months ────────────────────── */}
      <div className="card space-y-4">
        <h3 className="text-sm font-bold text-text-primary">Tren 6 Bulan Terakhir</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barGap={4} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: '#5A5A5A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatShortCurrency(v).replace('Rp ', '')}
              tick={{ fill: '#5A5A5A', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2A2A2A' }} />
            <Bar dataKey="Pemasukan"   fill="#A8E6CF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Pengeluaran" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4">
          {[['Pemasukan', '#A8E6CF'], ['Pengeluaran', '#FF6B6B']].map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category Breakdown ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-text-primary">Komposisi Pengeluaran</h3>
          {catData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-text-muted text-sm">
              Belum ada pengeluaran
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar list */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-text-primary">Detail per Kategori</h3>
          {catData.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">Belum ada pengeluaran</p>
          ) : (
            <div className="space-y-3">
              {catData.map((cat) => {
                const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-text-secondary">{cat.label}</span>
                        <span className="text-xs font-semibold text-text-primary">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
