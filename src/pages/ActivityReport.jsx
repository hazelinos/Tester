import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import clsx from 'clsx';

const MINT = '#A8E6CF';
const CORAL = '#FF6B6B';
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="bg-card border border-border rounded-xl p-2.5 shadow-xl text-xs"><p className="font-bold text-text-primary mb-1">{label}</p>{payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>)}</div>;
}

export default function ActivityReport({ selectedDate, onCategorySelect }) {
  const { transactions } = useFinance();
  const [range, setRange] = useState(6);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(false);

  const monthTransactions = useMemo(() => transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === selectedDate.getFullYear() && d.getMonth() === selectedDate.getMonth(); }), [transactions, selectedDate]);
  const income = monthTransactions.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount || 0), 0);
  const expense = monthTransactions.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount || 0), 0);
  const net = income - expense;

  const previousDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
  const previousExpense = transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === previousDate.getFullYear() && d.getMonth() === previousDate.getMonth() && t.type === 'expense'; }).reduce((s,t) => s + Number(t.amount || 0), 0);
  const expenseChange = previousExpense > 0 ? ((expense - previousExpense) / previousExpense) * 100 : null;

  const trend = useMemo(() => Array.from({ length: range }, (_, i) => {
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - (range - 1 - i), 1);
    const txs = transactions.filter(t => { const td = new Date(t.date); return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth(); });
    return { key: monthKey(d), label: getMonthName(d.getMonth()).slice(0,3), fullLabel: `${getMonthName(d.getMonth())} ${d.getFullYear()}`, income: txs.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount || 0), 0), expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount || 0), 0) };
  }), [transactions, selectedDate, range]);

  const categories = useMemo(() => {
    const map = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + Number(t.amount || 0); });
    const sorted = Object.entries(map).map(([id, amount]) => ({ ...getCategoryById(id), amount })).sort((a,b) => b.amount - a.amount);
    if (sorted.length <= 7) return sorted;
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6).reduce((s,c) => s + c.amount, 0);
    return [...top, { id: 'other', label: 'Lainnya', icon: '💸', color: '#777777', amount: rest }];
  }, [monthTransactions]);
  const totalCategories = categories.reduce((s,c) => s + c.amount, 0);
  const visibleCategories = expandedCategories ? categories : categories.slice(0, 5);

  const insight = useMemo(() => {
    if (!monthTransactions.length || !expense) return null;
    const top = categories[0];
    const parts = [];
    if (top && totalCategories > 0) parts.push(`Kategori terbesar adalah ${top.label} dengan ${Math.round(top.amount / totalCategories * 100)}% dari total pengeluaran.`);
    if (expenseChange !== null) parts.push(`Pengeluaran bulan ini ${Math.abs(expenseChange).toFixed(1)}% ${expenseChange <= 0 ? 'lebih rendah' : 'lebih tinggi'} dibanding bulan lalu.`);
    return parts;
  }, [monthTransactions, expense, categories, totalCategories, expenseChange]);

  if (!monthTransactions.length) return <div className="bg-card border border-border rounded-2xl p-8 text-center"><p className="text-2xl">📊</p><p className="font-semibold text-text-primary mt-2">Belum ada data untuk dianalisis.</p><p className="text-xs text-text-muted mt-1">Tambahkan transaksi pada bulan ini untuk melihat laporan.</p></div>;

  return <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2">{[['Pemasukan', income, 'text-income'], ['Pengeluaran', expense, 'text-expense'], [net < 0 ? 'Defisit' : 'Selisih', net, net < 0 ? 'text-expense' : 'text-income']].map(([label,value,color]) => <div key={label} className="bg-card border border-border rounded-2xl p-2.5 text-center"><p className="text-[10px] text-text-muted">{label}</p><p className={clsx('text-xs font-bold mt-1',color)}>{value < 0 ? '-' : ''}{formatShortCurrency(Math.abs(value))}</p></div>)}</div>
    {expenseChange !== null && <div className="bg-card border border-border rounded-2xl p-3"><p className="text-[10px] text-text-muted">Dibanding bulan sebelumnya</p><p className={clsx('text-sm font-bold mt-1', expenseChange <= 0 ? 'text-income' : 'text-expense')}>{expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange).toFixed(1)}% pengeluaran</p></div>}
    <section className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center justify-between mb-3"><div><p className="text-sm font-bold text-text-primary">Tren 6 Bulan Terakhir</p><p className="text-[10px] text-text-muted mt-0.5">Pemasukan vs pengeluaran</p></div><div className="flex bg-elevated rounded-lg p-0.5"><button onClick={() => setRange(6)} className={clsx('px-2.5 py-1 rounded-md text-[10px] font-semibold', range === 6 ? 'bg-card text-primary' : 'text-text-muted')}>6 Bulan</button><button onClick={() => setRange(12)} className={clsx('px-2.5 py-1 rounded-md text-[10px] font-semibold', range === 12 ? 'bg-card text-primary' : 'text-text-muted')}>1 Tahun</button></div></div>
      <ResponsiveContainer width="100%" height={210}><BarChart data={trend} barGap={2} barCategoryGap={range === 12 ? '18%' : '24%'} onClick={state => { const p = state?.activePayload?.[0]?.payload; if (p) setSelectedMonth(p); }}><XAxis dataKey="label" tick={{ fill:'#777', fontSize:10 }} axisLine={false} tickLine={false}/><YAxis tickFormatter={v => formatShortCurrency(v).replace('Rp ','')} tick={{ fill:'#777', fontSize:9 }} axisLine={false} tickLine={false} width={38}/><Tooltip content={<TooltipContent/>}/><Bar dataKey="income" name="Pemasukan" fill={MINT} radius={[4,4,0,0]}/><Bar dataKey="expense" name="Pengeluaran" fill={CORAL} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
      {selectedMonth && <div className="mt-2 bg-elevated rounded-xl p-2.5"><p className="text-xs font-bold text-text-primary">{selectedMonth.fullLabel}</p><div className="grid grid-cols-2 gap-2 mt-1.5"><p className="text-[11px] text-income">Pemasukan: {formatCurrency(selectedMonth.income)}</p><p className="text-[11px] text-expense">Pengeluaran: {formatCurrency(selectedMonth.expense)}</p></div></div>}
      <div className="flex gap-4 mt-2"><span className="text-[10px] text-text-muted"><i className="inline-block w-2 h-2 rounded-full mr-1" style={{backgroundColor:MINT}}/>Pemasukan</span><span className="text-[10px] text-text-muted"><i className="inline-block w-2 h-2 rounded-full mr-1" style={{backgroundColor:CORAL}}/>Pengeluaran</span></div>
    </section>
    <section className="bg-card border border-border rounded-2xl p-3">
      <p className="text-sm font-bold text-text-primary">Pengeluaran per Kategori</p>
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-3"><div className="relative w-44 h-44 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="amount" nameKey="label" innerRadius={52} outerRadius={78} paddingAngle={2} onClick={(_, index) => { const c = categories[index]; if (c && c.id !== 'other') onCategorySelect?.(c.id); }}>{categories.map(c => <Cell key={c.id} fill={c.color}/>)}</Pie><Tooltip formatter={(v) => formatCurrency(v)}/></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-lg font-bold text-text-primary">{formatShortCurrency(totalCategories)}</span><span className="text-[9px] text-text-muted">Total Pengeluaran</span></div></div><div className="flex-1 w-full space-y-2">{categories.map(c => { const pct = totalCategories ? c.amount / totalCategories * 100 : 0; return <button key={c.id} onClick={() => c.id !== 'other' && onCategorySelect?.(c.id)} className="w-full text-left flex items-center gap-2"><span className="w-6 text-center">{c.icon}</span><span className="flex-1 min-w-0"><span className="flex justify-between gap-2"><span className="text-[11px] text-text-secondary truncate">{c.label}</span><span className="text-[10px] font-semibold text-text-primary">{pct.toFixed(0)}% · {formatShortCurrency(c.amount)}</span></span><span className="block h-1.5 bg-elevated rounded-full overflow-hidden mt-1"><span className="block h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:c.color }}/></span></span></button>; })}</div></div>
    </section>
    <section className="bg-card border border-border rounded-2xl p-3"><div className="flex items-center justify-between"><p className="text-sm font-bold text-text-primary">Per Kategori</p>{categories.length > 5 && <button onClick={() => setExpandedCategories(v => !v)} className="text-[11px] text-primary font-semibold">{expandedCategories ? 'Tutup' : 'Lihat semua →'}</button>}</div><div className="space-y-3 mt-3">{visibleCategories.map(c => { const pct = totalCategories ? c.amount / totalCategories * 100 : 0; return <button key={c.id} onClick={() => c.id !== 'other' && onCategorySelect?.(c.id)} className="w-full text-left"><div className="flex items-center gap-2"><span>{c.icon}</span><div className="flex-1"><div className="flex justify-between"><span className="text-xs text-text-secondary">{c.label}</span><span className="text-xs font-semibold text-text-primary">{formatShortCurrency(c.amount)}</span></div><div className="h-1.5 bg-elevated rounded-full overflow-hidden mt-1"><div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:c.color }}/></div></div></div></button>; })}</div></section>
    {insight?.length > 0 && <section className="bg-card border border-border rounded-2xl p-3"><p className="text-sm font-bold text-text-primary">💡 Analisis Singkat</p><div className="space-y-2 mt-2">{insight.map(text => <p key={text} className="text-xs leading-relaxed text-text-secondary">{text}</p>)}</div></section>}
  </div>;
}
