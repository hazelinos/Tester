import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  List,
  PieChart,
  Plus,
  Settings,
  Target,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { formatCurrency, formatDate, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

const SHORTCUTS = [
  { id: 'add', label: 'Tambah', Icon: Plus },
  { id: 'transactions', label: 'Transaksi', Icon: List, to: '/history' },
  { id: 'report', label: 'Laporan', Icon: PieChart, to: '/report' },
  { id: 'target', label: 'Target', Icon: Target, to: '/savings' },
  { id: 'reminder', label: 'Pengingat', Icon: Bell },
  { id: 'settings', label: 'Pengaturan', Icon: Settings, to: '/settings' },
];

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari' },
  { id: 'thisMonth', label: 'Bulan Ini' },
  { id: 'lastMonth', label: 'Bulan Lalu' },
];

function getPeriodBounds(period) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'today') return { start: todayStart, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
  if (period === '7days') return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
  if (period === 'thisMonth') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  if (period === 'lastMonth') return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
  return { start: todayStart, end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
}

function TransactionRow({ transaction, onEdit }) {
  const cat = getCategoryById(transaction.categoryId);
  const income = transaction.type === 'income';
  const time = transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <button onClick={() => onEdit?.(transaction)} className="dashboard-transaction-row">
      <span className="dashboard-transaction-icon" style={{ background: `${cat.color}18`, color: cat.color }}>{cat.icon}</span>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-semibold text-white truncate">{transaction.note || cat.label}</span>
        <span className="block text-[11px] text-white/45 mt-1 truncate">{transaction.note ? cat.label : 'Transaksi'}{time ? ` · ${time}` : ` · ${formatDate(transaction.date, 'short')}`}</span>
      </span>
      <span className={clsx('text-sm font-bold shrink-0', income ? 'text-[#43E49A]' : 'text-[#FF6978]')}>{income ? '+' : '-'} {formatCurrency(transaction.amount)}</span>
    </button>
  );
}

function ShortcutCard({ item, onAdd, onReminder }) {
  const { Icon, label, to, id } = item;
  const content = <span className="dashboard-shortcut-card"><span className={clsx('dashboard-shortcut-icon', id === 'add' ? 'is-add' : id === 'reminder' ? 'is-reminder' : '')}><Icon size={22} strokeWidth={2.2} /></span><span className="dashboard-shortcut-label">{label}</span></span>;
  if (id === 'add') return <button onClick={onAdd} className="shrink-0">{content}</button>;
  if (id === 'reminder') return <button onClick={onReminder} className="shrink-0">{content}</button>;
  return <Link to={to} className="shrink-0">{content}</Link>;
}

export default function Dashboard() {
  const { openAdd, openEdit } = useOutletContext();
  const mobile = useIsMobile();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [transactionPeriod, setTransactionPeriod] = useState('today');

  const { accounts, transactions, getMonthlyIncome, getMonthlyExpense, getTotalBalance, getExpenseByCategory } = useFinance();

  const income = useMemo(() => getMonthlyIncome(selectedMonth), [getMonthlyIncome, selectedMonth]);
  const expense = useMemo(() => getMonthlyExpense(selectedMonth), [getMonthlyExpense, selectedMonth]);
  const balance = useMemo(() => getTotalBalance(), [getTotalBalance]);
  const previousMonth = useMemo(() => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1), [selectedMonth]);
  const previousIncome = useMemo(() => getMonthlyIncome(previousMonth), [getMonthlyIncome, previousMonth]);
  const previousExpense = useMemo(() => getMonthlyExpense(previousMonth), [getMonthlyExpense, previousMonth]);
  const monthNet = income - expense;
  const previousNet = previousIncome - previousExpense;
  const changePercent = previousNet !== 0 ? ((monthNet - previousNet) / Math.abs(previousNet)) * 100 : null;

  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodBounds(transactionPeriod);
    return (transactions || []).filter((tx) => {
      const d = new Date(tx.date);
      return d >= start && d < end;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [transactions, transactionPeriod]);

  const expByCat = useMemo(() => getExpenseByCategory(selectedMonth), [getExpenseByCategory, selectedMonth]);
  const topCats = useMemo(() => Object.entries(expByCat).map(([id, amount]) => ({ ...getCategoryById(id), amount })).sort((a, b) => b.amount - a.amount).slice(0, 3), [expByCat]);

  const moveMonth = (direction) => setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  const openReminders = () => window.dispatchEvent(new CustomEvent('montra:open-reminders'));

  const transactionSubtitle = transactionPeriod === 'today'
    ? 'Transaksi yang terjadi hari ini'
    : transactionPeriod === '7days'
      ? 'Aktivitas 7 hari terakhir'
      : transactionPeriod === 'lastMonth'
        ? 'Aktivitas bulan lalu'
        : `Aktivitas ${getMonthName(new Date().getMonth())} ${new Date().getFullYear()}`;

  return (
    <div className="dashboard-page min-h-full pb-24 sm:pb-8">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="dashboard-logo"><img src="/montra-logo.svg" alt="Montra" /></div>
            <div className="min-w-0"><h1>Montra</h1><div className="dashboard-marquee" aria-label="A Simple Money Tracker For Your Finance"><div className="dashboard-marquee-track">A Simple Money Tracker For Your Finance</div></div></div>
          </div>
          <div className="dashboard-month-picker">
            <button onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={21} /></button>
            <span>{getMonthName(selectedMonth.getMonth())} {selectedMonth.getFullYear()}</span>
            <button onClick={() => moveMonth(1)} aria-label="Bulan berikutnya"><ChevronRight size={21} /></button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-balance">
          <div className="dashboard-balance-top">
            <div className="dashboard-balance-title"><p>Total Uang</p><button onClick={() => setBalanceVisible((visible) => !visible)} className="dashboard-balance-eye" aria-label="Tampilkan atau sembunyikan nominal">{balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}</button></div>
            {changePercent !== null && <div className={clsx('dashboard-change', changePercent >= 0 ? 'positive' : 'negative')}><span>{changePercent >= 0 ? '↗' : '↘'} {Math.abs(changePercent).toFixed(1)}%</span><small>Dari bulan lalu</small></div>}
          </div>
          <div className="dashboard-balance-amount">{balanceVisible ? formatCurrency(balance) : 'Rp •••••••'}</div>
          <div className="dashboard-balance-meta"><CalendarDays size={13} /> {accounts.length} akun aktif</div>
        </section>

        <section className="dashboard-stats">
          <div className="dashboard-stat income"><span className="dashboard-stat-icon"><ArrowUp size={23} /></span><div><p>Pemasukan</p><strong>{formatShortCurrency(income)}</strong></div></div>
          <div className="dashboard-stat expense"><span className="dashboard-stat-icon"><ArrowDown size={23} /></span><div><p>Pengeluaran</p><strong>{formatShortCurrency(expense)}</strong></div></div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading"><h2>Shortcut</h2><button onClick={openReminders} className="dashboard-see-all">Lihat Semua <ChevronRight size={18} /></button></div>
          <div className="dashboard-shortcuts">{SHORTCUTS.map((item) => <ShortcutCard key={item.id} item={item} onAdd={openAdd} onReminder={openReminders} />)}</div>
        </section>

        <section className="dashboard-section dashboard-transactions-section">
          <div className="dashboard-section-heading dashboard-transaction-heading"><div><h2>Transaksi</h2><p>{transactionSubtitle}</p></div><Link to="/history" className="dashboard-see-all">Lihat Semua <ChevronRight size={18} /></Link></div>
          <div className="dashboard-periods">{PERIOD_OPTIONS.map((option) => <button key={option.id} onClick={() => setTransactionPeriod(option.id)} className={clsx(transactionPeriod === option.id && 'active')}>{option.label}</button>)}</div>
          <div className="dashboard-transaction-card">{filteredTransactions.length > 0 ? filteredTransactions.slice(0, mobile ? 5 : 8).map((tx) => <TransactionRow key={tx.id} transaction={tx} onEdit={openEdit} />) : <p className="dashboard-empty">Belum ada transaksi untuk {PERIOD_OPTIONS.find((item) => item.id === transactionPeriod)?.label.toLowerCase()}.</p>}</div>
        </section>

        {topCats.length > 0 && <section className="dashboard-section dashboard-top-expenses"><div className="dashboard-section-heading"><h2>Pengeluaran Terbesar</h2><span>Bulan ini</span></div><div className="dashboard-top-expenses-card">{topCats.map((cat) => <div key={cat.id} className="dashboard-top-expense-row"><span className="dashboard-top-expense-icon" style={{ background: `${cat.color}18`, color: cat.color }}>{cat.icon}</span><div className="flex-1 min-w-0"><strong>{cat.label}</strong><span><i style={{ width: `${Math.max(8, (cat.amount / Math.max(topCats[0].amount, 1)) * 100)}%`, background: cat.color }} /></span></div><b>{formatShortCurrency(cat.amount)}</b></div>)}</div></section>}
      </main>
    </div>
  );
}
