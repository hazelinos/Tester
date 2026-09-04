import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-2 text-xs shadow-xl">
      <p className="text-text-secondary font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatShortCurrency(p.value)}</p>
      ))}
    </div>
  );
};

// ── Konten laporan — bisa dipakai standalone atau di-embed ────────
export function ReportContent({ selectedDate, onChangeMonth, mobile, embedded = false }) {
  const { getMonthlyIncome, getMonthlyExpense, getExpenseByCategory, getLast6MonthsData } = useFinance();

  const income   = useMemo(() => getMonthlyIncome(selectedDate),     [getMonthlyIncome, selectedDate]);
  const expense  = useMemo(() => getMonthlyExpense(selectedDate),    [getMonthlyExpense, selectedDate]);
  const expByCat = useMemo(() => getExpenseByCategory(selectedDate), [getExpenseByCategory, selectedDate]);
  const last6    = useMemo(() => getLast6MonthsData(),                [getLast6MonthsData]);

  const savings     = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const barData = last6.map((d) => ({
    name:   getMonthName(d.month).substring(0, 3),
    Masuk:  d.income,
    Keluar: d.expense,
  }));

  const catData = useMemo(() =>
    Object.entries(expByCat)
      .map(([id, amount]) => ({ ...getCategoryById(id), amount, value: amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6),
    [expByCat]
  );
  const totalExp = catData.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pemasukan',   val: income,          color: '#A8E6CF' },
          { label: 'Pengeluaran', val: expense,         color: '#FF6B6B' },
          { label: savings >= 0 ? 'Tabungan' : 'Defisit',
            val: Math.abs(savings), color: savings >= 0 ? '#A8E6CF' : '#FF6B6B' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
            <p className="text-[10px] text-text-muted mb-0.5">{s.label}</p>
            <p className="text-xs font-bold" style={{ color: s.color }}>
              {mobile ? formatShortCurrency(s.val) : formatCurrency(s.val)}
            </p>
          </div>
        ))}
      </div>

      {/* Savings rate */}
      {income > 0 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-text-muted">
              {savings >= 0 ? '💰 Tingkat Tabungan' : '⚠️ Defisit'}
            </span>
            <span className="text-xs font-bold" style={{ color: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }}>
              {Math.abs(savingsRate)}%
            </span>
          </div>
          <div className="h-2 bg-elevated rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }} />
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-xs font-bold text-text-primary mb-3">6 Bulan Terakhir</p>
        <ResponsiveContainer width="100%" height={mobile ? 130 : 200}>
          <BarChart data={barData} barGap={2} barCategoryGap="25%">
            <XAxis dataKey="name" tick={{ fill: '#5A5A5A', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatShortCurrency(v).replace('Rp ', '')}
              tick={{ fill: '#5A5A5A', fontSize: 9 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2A2A2A' }} />
            <Bar dataKey="Masuk"  fill="#A8E6CF" radius={[3,3,0,0]} />
            <Bar dataKey="Keluar" fill="#FF6B6B" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-1">
          {[['Masuk','#A8E6CF'],['Keluar','#FF6B6B']].map(([l,c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="text-[10px] text-text-secondary">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-xs font-bold text-text-primary mb-3">Per Kategori</p>
        {catData.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">Belum ada pengeluaran</p>
        ) : mobile ? (
          <div className="space-y-2.5">
            {catData.map((cat) => {
              const pct = totalExp > 0 ? (cat.amount / totalExp) * 100 : 0;
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-base w-6 text-center">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs text-text-secondary">{cat.label}</span>
                      <span className="text-xs font-semibold text-text-primary">{formatShortCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [formatCurrency(v), '']}
                  contentStyle={{ background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {catData.map((cat) => {
                const pct = totalExp > 0 ? (cat.amount / totalExp) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-lg w-6">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-text-secondary">{cat.label}</span>
                        <span className="text-xs font-semibold">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Standalone page (route /report masih ada untuk desktop nav) ───
export default function Report() {
  const mobile             = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;

  const changeMonth = (dir) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-5xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      <div className="flex items-center justify-between">
        {!mobile && <h1 className="text-2xl font-bold text-text-primary">Laporan</h1>}
        <div className={clsx('flex items-center gap-1', mobile && 'w-full justify-between')}>
          {mobile && <p className="text-base font-bold text-text-primary">Laporan</p>}
          <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(-1)} className="p-1 text-text-muted"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold text-text-primary min-w-28 text-center">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1 text-text-muted"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
      <ReportContent selectedDate={selectedDate} onChangeMonth={changeMonth} mobile={mobile} />
    </div>
  );
}
