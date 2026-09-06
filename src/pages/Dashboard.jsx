import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  Pencil,
  PiggyBank,
  Radio,
  Target,
  WalletCards,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatCurrency, formatDate, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

const SHORTCUT_OPTIONS = [
  { id: '/savings', label: 'Tabungan', Icon: PiggyBank },
  { id: '/budget', label: 'Budget', Icon: Target },
  { id: '/debt', label: 'Hutang', Icon: Landmark },
  { id: '/subscriptions', label: 'Langganan', Icon: Radio },
  { id: '/history', label: 'Aktivitas', Icon: BarChart3 },
  { id: '/report', label: 'Laporan', Icon: BarChart3 },
  { id: '/accounts', label: 'Akun', Icon: CreditCard },
];

const DEFAULT_SHORTCUTS = ['/savings', '/budget', '/debt', '/subscriptions'];
const STORAGE_KEY = 'dashboard_shortcuts';
const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari' },
  { id: 'thisMonth', label: 'Bulan Ini' },
  { id: 'lastMonth', label: 'Bulan Lalu' },
];

function loadShortcuts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS;
    return Array.isArray(parsed) && parsed.length >= 2 ? parsed : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

function ShortcutEditModal({ selected, onSave, onClose }) {
  const [picks, setPicks] = useState(selected);
  const toggle = (id) => {
    if (picks.includes(id)) {
      if (picks.length <= 2) return;
      setPicks(picks.filter((item) => item !== id));
    } else if (picks.length < 4) {
      setPicks([...picks, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/70 backdrop-blur-sm">
      <div className="modal-sheet w-full max-w-sm rounded-3xl border border-white/10 bg-[#111815] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div><h2 className="font-bold text-base text-white">Edit Shortcut</h2><p className="text-xs text-white/45 mt-0.5">Pilih 2–4 shortcut</p></div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/50 hover:bg-white/5"><X size={17} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {SHORTCUT_OPTIONS.map(({ id, label, Icon }) => {
              const selectedNow = picks.includes(id);
              const disabled = !selectedNow && picks.length >= 4;
              return <button key={id} onClick={() => toggle(id)} disabled={disabled}
                className={clsx('flex items-center gap-3 p-3 rounded-2xl border text-left transition-all', selectedNow ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/8 bg-white/[.025] text-white/70', disabled && 'opacity-35 cursor-not-allowed')}>
                <span className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Icon size={17} /></span>
                <span className="text-xs font-semibold truncate">{label}</span>
              </button>;
            })}
          </div>
          <button onClick={() => { onSave(picks); onClose(); }} className="btn-primary w-full py-3 rounded-2xl">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({ option, savingsGoals, budgetUsage, overBudget }) {
  const { id, label, Icon } = option;
  let value = 'Kelola';
  let sub = '';
  if (id === '/savings') {
    const saved = (savingsGoals || []).reduce((sum, goal) => sum + Number(goal.collected || 0), 0);
    const active = (savingsGoals || []).filter((goal) => Number(goal.collected || 0) < Number(goal.target || 0)).length;
    value = formatShortCurrency(saved);
    sub = `${active} target aktif`;
  } else if (id === '/budget') {
    value = `${budgetUsage.length} kategori`;
    sub = overBudget ? `${overBudget} melebihi limit` : 'Semua aman';
  } else if (id === '/debt') sub = 'Hutang & cicilan';
  else if (id === '/subscriptions') sub = 'Langganan rutin';
  else if (id === '/history') { value = 'Lihat'; sub = 'Semua aktivitas'; }
  else if (id === '/report') { value = 'Lihat'; sub = 'Laporan keuangan'; }
  else if (id === '/accounts') sub = 'Daftar akun';

  return <Link to={id} className="dashboard-shortcut shrink-0 w-[132px] sm:w-[150px] rounded-2xl p-3.5">
    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><Icon size={18} /></div>
    <p className="text-xs font-semibold text-white/85 truncate">{label}</p>
    <p className="text-sm font-bold text-primary mt-1 truncate">{value}</p>
    <p className="text-[10px] text-white/35 mt-0.5 truncate">{sub}</p>
  </Link>;
}

function TransactionRow({ transaction, onEdit }) {
  const cat = getCategoryById(transaction.categoryId);
  const income = transaction.type === 'income';
  const time = transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  return <button onClick={() => onEdit?.(transaction)} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-white/[.055] last:border-0 hover:bg-white/[.025] transition-colors rounded-xl px-1">
    <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${cat.color}18` }}>{cat.icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold text-white/90 truncate">{transaction.note || cat.label}</span>
      <span className="block text-[11px] text-white/35 mt-1 truncate">{cat.label} · {formatDate(transaction.date, 'short')}{time ? ` · ${time}` : ''}</span>
    </span>
    <span className={clsx('text-sm font-bold shrink-0', income ? 'text-[#A8E6CF]' : 'text-[#FF8C8C]')}>{income ? '+' : '-'}{formatCurrency(transaction.amount)}</span>
  </button>;
}

function getPeriodBounds(period) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return { start: todayStart, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
  if (period === '7days') return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
  if (period === 'thisMonth') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  if (period === 'lastMonth') return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
  return { start: todayStart, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
}

export default function Dashboard() {
  const { openEdit } = useOutletContext();
  const mobile = useIsMobile();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const [editingShortcut, setEditingShortcut] = useState(false);
  const [transactionPeriod, setTransactionPeriod] = useState('today');
  const { accounts, transactions, getMonthlyIncome, getMonthlyExpense, getTotalBalance, getExpenseByCategory, savings: savingsGoals, getBudgetUsage } = useFinance();
  const currentMonth = useMemo(() => new Date(), []);
  const income = useMemo(() => getMonthlyIncome(currentMonth), [getMonthlyIncome, currentMonth]);
  const expense = useMemo(() => getMonthlyExpense(currentMonth), [getMonthlyExpense, currentMonth]);
  const balance = useMemo(() => getTotalBalance(), [getTotalBalance]);
  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodBounds(transactionPeriod);
    return (transactions || []).filter((tx) => { const d = new Date(tx.date); return d >= start && d < end; });
  }, [transactions, transactionPeriod]);
  const budgetUsage = useMemo(() => getBudgetUsage(currentMonth), [getBudgetUsage, currentMonth]);
  const overBudget = useMemo(() => budgetUsage.filter((b) => b.spent > b.amount).length, [budgetUsage]);
  const expByCat = useMemo(() => getExpenseByCategory(currentMonth), [getExpenseByCategory, currentMonth]);
  const topCats = useMemo(() => Object.entries(expByCat).map(([id, amount]) => ({ ...getCategoryById(id), amount })).sort((a, b) => b.amount - a.amount).slice(0, 3), [expByCat]);
  const monthlySavings = income - expense;
  const savingsRate = income > 0 ? Math.round((monthlySavings / income) * 100) : 0;
  const saveShortcuts = (picks) => { setShortcuts(picks); localStorage.setItem(STORAGE_KEY, JSON.stringify(picks)); };
  const periodLabel = PERIOD_OPTIONS.find((item) => item.id === transactionPeriod)?.label || 'Hari Ini';
  const transactionSubtitle = transactionPeriod === 'today' ? 'Transaksi yang terjadi hari ini' : transactionPeriod === '7days' ? 'Aktivitas 7 hari terakhir' : transactionPeriod === 'lastMonth' ? 'Aktivitas bulan lalu' : `Aktivitas ${getMonthName(currentMonth.getMonth())} ${currentMonth.getFullYear()}`;

  return <div className="dashboard-page min-h-full pb-24 sm:pb-8">
    <header className="dashboard-header px-4 sm:px-7 pt-5 pb-4"><div className="max-w-6xl mx-auto"><div className="flex items-center gap-3 min-w-0"><div className="dashboard-logo"><img src="/montra-logo.svg" alt="Montra" /></div><div className="min-w-0"><h1 className="text-[22px] sm:text-2xl font-extrabold tracking-tight text-white">Montra</h1><div className="dashboard-marquee mt-0.5" aria-label="A Simple Money Tracker For Your Finance"><div className="dashboard-marquee-track">A Simple Money Tracker For Your Finance</div></div></div></div></div></header>
    <main className="max-w-6xl mx-auto px-4 sm:px-7 pt-4 sm:pt-6 space-y-5">
      <section className="dashboard-balance relative overflow-hidden rounded-[26px] p-5 sm:p-7"><div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" /><div className="relative"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary/70">Total Uang</p><button onClick={() => setBalanceVisible((v) => !v)} className="dashboard-icon-button" aria-label="Tampilkan atau sembunyikan nominal">{balanceVisible ? <Eye size={17} /> : <EyeOff size={17} />}</button></div><div className="flex items-end justify-between gap-4 mt-2"><p className="text-[30px] sm:text-[40px] leading-none font-extrabold tracking-tight text-white">{balanceVisible ? formatCurrency(balance) : 'Rp ••••••'}</p><span className="hidden sm:flex items-center gap-1.5 text-xs text-white/45"><WalletCards size={14} /> {accounts.length} akun</span></div><div className="flex gap-2.5 overflow-x-auto scrollbar-none mt-5">{accounts.map((account) => <div key={account.id} className="dashboard-account-chip shrink-0" style={{ borderColor: `${account.color}35` }}><span className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: `${account.color}18` }}>{account.iconType === 'photo' && account.iconPhoto ? <img src={account.iconPhoto} alt="" className="w-full h-full object-cover" /> : <span>{account.icon}</span>}</span><span className="text-xs font-semibold" style={{ color: account.color }}>{balanceVisible ? formatShortCurrency(account.balance) : '••••'}</span></div>)}</div></div></section>
      <section className="grid grid-cols-2 gap-3"><div className="dashboard-stat-card"><span className="dashboard-stat-icon income"><ArrowDownLeft size={17} /></span><span className="text-xs text-white/45">Pemasukan</span><strong className="text-lg sm:text-xl text-[#A8E6CF]">{formatShortCurrency(income)}</strong></div><div className="dashboard-stat-card"><span className="dashboard-stat-icon expense"><ArrowUpRight size={17} /></span><span className="text-xs text-white/45">Pengeluaran</span><strong className="text-lg sm:text-xl text-[#FF8C8C]">{formatShortCurrency(expense)}</strong></div></section>
      {income > 0 && <section className="dashboard-glass-card p-4 sm:p-5"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-xs font-semibold text-white/55">Sisa bulan ini</span><span className={clsx('text-xs font-bold', savingsRate >= 0 ? 'text-primary' : 'text-[#FF8C8C]')}>{savingsRate}% tersimpan</span></div><div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }} /></div><p className="text-sm font-bold text-white/85 mt-2">{formatShortCurrency(monthlySavings)}</p></section>}
      <section><div className="flex items-center justify-between mb-3 px-0.5"><div><h2 className="text-base font-bold text-white">Shortcut</h2><p className="text-[11px] text-white/35 mt-0.5">Akses cepat ke fitur favorit</p></div><button onClick={() => setEditingShortcut(true)} className="dashboard-edit-button"><Pencil size={13} /> Edit</button></div><div className="flex gap-3 overflow-x-auto scrollbar-none snap-x pb-1">{shortcuts.map((id) => { const option = SHORTCUT_OPTIONS.find((item) => item.id === id); return option ? <ShortcutCard key={id} option={option} savingsGoals={savingsGoals} budgetUsage={budgetUsage} overBudget={overBudget} /> : null; })}</div></section>
      <section className="dashboard-glass-card p-4 sm:p-5"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3"><div><h2 className="text-base font-bold text-white">Transaksi</h2><p className="text-[11px] text-white/35 mt-0.5">{transactionSubtitle}</p></div><div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">{PERIOD_OPTIONS.map((option) => <button key={option.id} onClick={() => setTransactionPeriod(option.id)} className={clsx('shrink-0 rounded-xl px-3 py-2 text-[11px] font-semibold border transition-all', transactionPeriod === option.id ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/[.025] border-white/8 text-white/45 hover:text-white/70')}>{option.label}</button>)}</div></div>{filteredTransactions.length ? filteredTransactions.slice(0, mobile ? 5 : 8).map((tx) => <TransactionRow key={tx.id} transaction={tx} onEdit={openEdit} />) : <p className="py-8 text-center text-sm text-white/30">Belum ada transaksi untuk {periodLabel.toLowerCase()}</p>}{filteredTransactions.length > (mobile ? 5 : 8) && <Link to="/history" className="block text-center text-xs font-semibold text-primary pt-3">Lihat semua transaksi</Link>}</section>
      {topCats.length > 0 && <section className="dashboard-glass-card p-4 sm:p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-base font-bold text-white">Pengeluaran Terbesar</h2><span className="text-[11px] text-white/35">Bulan ini</span></div><div className="space-y-3">{topCats.map((cat) => <div key={cat.id} className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cat.color}18` }}>{cat.icon}</span><span className="flex-1 min-w-0"><span className="block text-xs font-semibold text-white/75 truncate">{cat.label}</span><span className="block h-1.5 rounded-full bg-white/5 mt-1.5 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${Math.max(8, (cat.amount / Math.max(topCats[0].amount, 1)) * 100)}%`, background: cat.color }} /></span></span><strong className="text-xs text-white/70">{formatShortCurrency(cat.amount)}</strong></div>)}</div></section>}
    </main>
    {editingShortcut && <ShortcutEditModal selected={shortcuts} onSave={saveShortcuts} onClose={() => setEditingShortcut(false)} />}
  </div>;
}
