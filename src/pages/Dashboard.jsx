import { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  GripVertical,
  Landmark,
  PiggyBank,
  Plus,
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
  { id: '/accounts', label: 'Dompet', Icon: CreditCard },
  { id: '/savings', label: 'Tabungan', Icon: PiggyBank },
  { id: '/budget', label: 'Budget', Icon: Target },
  { id: '/debt', label: 'Hutang', Icon: Landmark },
  { id: '/subscriptions', label: 'Langganan', Icon: Radio },
];

const DEFAULT_SHORTCUTS = ['/accounts', '/savings', '/budget', '/debt', '/subscriptions'];
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
    if (!Array.isArray(parsed)) return DEFAULT_SHORTCUTS;
    const valid = parsed.filter((id, index) => SHORTCUT_OPTIONS.some((option) => option.id === id) && parsed.indexOf(id) === index);
    return valid.length ? valid : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

function ShortcutEditModal({ selected, onSave, onClose }) {
  const [picks, setPicks] = useState(selected.filter((id) => SHORTCUT_OPTIONS.some((option) => option.id === id)));
  const [draggedId, setDraggedId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addShortcut = (id) => {
    setPicks((current) => current.includes(id) ? current : [...current, id]);
  };

  const removeShortcut = (id) => {
    setPicks((current) => current.filter((item) => item !== id));
  };

  const moveShortcut = (targetId) => {
    if (!draggedId || draggedId === targetId) return;
    setPicks((current) => {
      const next = [...current];
      const from = next.indexOf(draggedId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return current;
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  };

  const selectedOptions = picks.map((id) => SHORTCUT_OPTIONS.find((option) => option.id === id)).filter(Boolean);
  const availableOptions = SHORTCUT_OPTIONS.filter((option) => !picks.includes(option.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/70 backdrop-blur-sm">
      <div className="modal-sheet w-full max-w-sm rounded-3xl border border-white/10 bg-[#111815] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-bold text-base text-white">Atur Shortcut</h2>
            <p className="text-xs text-white/45 mt-0.5">Geser untuk mengatur urutan</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/50 hover:bg-white/5"><X size={17} /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {selectedOptions.length > 0 ? (
            <div className="space-y-2">
              {selectedOptions.map(({ id, label, Icon }, index) => (
                <div
                  key={id}
                  draggable
                  onDragStart={() => setDraggedId(id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => { event.preventDefault(); moveShortcut(id); }}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border px-3 py-3 bg-white/[.025] transition-all select-none',
                    draggedId === id ? 'border-primary/40 opacity-50' : 'border-white/8'
                  )}
                >
                  <span className="text-[10px] font-bold text-white/25 w-4 text-center">{index + 1}</span>
                  <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={17} /></span>
                  <span className="flex-1 text-xs font-semibold text-white/85">{label}</span>
                  <button type="button" onClick={() => removeShortcut(id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-red-300 hover:bg-red-400/10 transition-colors shrink-0" aria-label={`Hapus ${label} dari shortcut`}><X size={15} /></button>
                  <GripVertical size={17} className="text-white/25 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-7 text-center"><p className="text-xs text-white/35">Belum ada shortcut</p></div>
          )}

          <button type="button" onClick={() => setShowAddMenu((value) => !value)} disabled={availableOptions.length === 0} className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.025] px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:border-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <Plus size={15} /> Tambah Menu
          </button>

          {showAddMenu && availableOptions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {availableOptions.map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => addShortcut(id)} className="flex items-center gap-2.5 p-3 rounded-2xl border border-white/8 bg-white/[.025] text-left text-white/70 hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0"><Icon size={16} /></span>
                  <span className="text-xs font-semibold truncate">{label}</span>
                </button>
              ))}
            </div>
          )}

          <button onClick={() => { onSave(picks); onClose(); }} className="btn-primary w-full py-3 rounded-2xl mt-1">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({ option, savingsGoals, budgetUsage, overBudget }) {
  const { id, label, Icon } = option;
  let value = 'Kelola';
  let sub = '';
  if (id === '/accounts') sub = 'Akun & saldo';
  else if (id === '/savings') {
    const saved = (savingsGoals || []).reduce((sum, goal) => sum + Number(goal.collected || 0), 0);
    const active = (savingsGoals || []).filter((goal) => Number(goal.collected || 0) < Number(goal.target || 0)).length;
    value = formatShortCurrency(saved);
    sub = `${active} target aktif`;
  } else if (id === '/budget') {
    value = `${budgetUsage.length} kategori`;
    sub = overBudget ? `${overBudget} melebihi limit` : 'Semua aman';
  } else if (id === '/debt') sub = 'Hutang & cicilan';
  else if (id === '/subscriptions') sub = 'Langganan rutin';

  return <Link to={id} className="dashboard-shortcut shrink-0 w-[88px] sm:w-[100px] rounded-2xl p-2.5">
    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1.5"><Icon size={14} /></div>
    <p className="text-[10px] font-semibold text-white/85 truncate">{label}</p>
    <p className="text-[11px] font-bold text-primary mt-0.5 truncate">{value}</p>
    <p className="text-[8px] text-white/35 mt-0.5 truncate">{sub}</p>
  </Link>;
}

function AddShortcutCard({ onClick }) {
  return <button type="button" onClick={onClick} className="dashboard-shortcut shrink-0 w-[88px] sm:w-[100px] rounded-2xl p-2.5 flex flex-col items-center justify-center text-primary min-h-[112px]" aria-label="Atur shortcut">
    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5"><Plus size={16} /></span>
    <span className="text-[10px] font-semibold">Tambah</span>
  </button>;
}

function TransactionRow({ transaction, onEdit }) {
  const cat = getCategoryById(transaction.categoryId);
  const income = transaction.type === 'income';
  const time = transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
  return <button onClick={() => onEdit?.(transaction)} className="w-full flex items-center gap-3 py-3.5 text-left border-b border-white/[.055] last:border-0 hover:bg-white/[.025] transition-colors rounded-xl px-1">
    <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${cat.color}18` }}>{cat.icon}</span>
    <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-white/90 truncate">{transaction.note || cat.label}</span><span className="block text-[11px] text-white/35 mt-1 truncate">{cat.label} · {formatDate(transaction.date, 'short')}{time ? ` · ${time}` : ''}</span></span>
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
  const saveShortcuts = (picks) => { setShortcuts(picks); localStorage.setItem(STORAGE_KEY, JSON.stringify(picks)); };
  const periodLabel = PERIOD_OPTIONS.find((item) => item.id === transactionPeriod)?.label || 'Hari Ini';
  const transactionSubtitle = transactionPeriod === 'today' ? 'Transaksi yang terjadi hari ini' : transactionPeriod === '7days' ? 'Aktivitas 7 hari terakhir' : transactionPeriod === 'lastMonth' ? 'Aktivitas bulan lalu' : `Aktivitas ${getMonthName(currentMonth.getMonth())} ${currentMonth.getFullYear()}`;

  return <div className="dashboard-page min-h-full pb-8">
    <main className="max-w-6xl mx-auto px-4 sm:px-7 pt-4 sm:pt-6 space-y-5">
      <section className="dashboard-balance relative overflow-hidden rounded-[26px] p-5 sm:p-7"><div className="absolute -right-16 -top-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" /><div className="relative"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary/70">Total Uang</p><button onClick={() => setBalanceVisible((v) => !v)} className="dashboard-icon-button" aria-label="Tampilkan atau sembunyikan nominal">{balanceVisible ? <Eye size={17} /> : <EyeOff size={17} />}</button></div><div className="flex items-end justify-between gap-4 mt-2"><p className="text-[30px] sm:text-[40px] leading-none font-extrabold tracking-tight text-white">{balanceVisible ? formatCurrency(balance) : 'Rp ••••••'}</p><span className="hidden sm:flex items-center gap-1.5 text-xs text-white/45"><WalletCards size={14} /> {accounts.length} akun</span></div><div className="flex gap-2.5 overflow-x-auto scrollbar-none mt-5">{accounts.map((account) => <div key={account.id} className="dashboard-account-chip shrink-0" style={{ borderColor: `${account.color}35` }}><span className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: `${account.color}18` }}>{account.iconType === 'photo' && account.iconPhoto ? <img src={account.iconPhoto} alt="" className="w-full h-full object-cover" /> : <span>{account.icon}</span>}</span><span className="text-xs font-semibold" style={{ color: account.color }}>{balanceVisible ? formatShortCurrency(account.balance) : '••••'}</span></div>)}</div></div></section>
      <section className="grid grid-cols-2 gap-3"><div className="dashboard-stat-card"><span className="dashboard-stat-icon income"><ArrowDownLeft size={17} /></span><span className="text-xs text-white/45">Pemasukan</span><strong className="text-lg sm:text-xl text-[#A8E6CF]">{formatShortCurrency(income)}</strong></div><div className="dashboard-stat-card"><span className="dashboard-stat-icon expense"><ArrowUpRight size={17} /></span><span className="text-xs text-white/45">Pengeluaran</span><strong className="text-lg sm:text-xl text-[#FF8C8C]">{formatShortCurrency(expense)}</strong></div></section>
      <section><div className="flex gap-2 overflow-x-auto scrollbar-none snap-x pb-1 items-stretch">{shortcuts.map((id) => { const option = SHORTCUT_OPTIONS.find((item) => item.id === id); return option ? <ShortcutCard key={id} option={option} savingsGoals={savingsGoals} budgetUsage={budgetUsage} overBudget={overBudget} /> : null; })}<AddShortcutCard onClick={() => setEditingShortcut(true)} /></div></section>
      <section className="dashboard-glass-card p-4 sm:p-5"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3"><div><h2 className="text-base font-bold text-white">Transaksi</h2><p className="text-[11px] text-white/35 mt-0.5">{transactionSubtitle}</p></div><div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">{PERIOD_OPTIONS.map((option) => <button key={option.id} onClick={() => setTransactionPeriod(option.id)} className={clsx('shrink-0 rounded-xl px-3 py-2 text-[11px] font-semibold border transition-all', transactionPeriod === option.id ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-white/[.025] border-white/8 text-white/45 hover:text-white/70')}>{option.label}</button>)}</div></div>{filteredTransactions.length ? filteredTransactions.slice(0, mobile ? 5 : 8).map((tx) => <TransactionRow key={tx.id} transaction={tx} onEdit={openEdit} />) : <p className="py-8 text-center text-sm text-white/30">Belum ada transaksi untuk {periodLabel.toLowerCase()}</p>}{filteredTransactions.length > (mobile ? 5 : 8) && <Link to="/history" className="block text-center text-xs font-semibold text-primary pt-3">Lihat semua transaksi</Link>}</section>
      {topCats.length > 0 && <section className="dashboard-glass-card p-4 sm:p-5"><div className="flex items-center justify-between mb-4"><h2 className="text-base font-bold text-white">Pengeluaran Terbesar</h2><span className="text-[11px] text-white/35">Bulan ini</span></div><div className="space-y-3">{topCats.map((cat) => <div key={cat.id} className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cat.color}18` }}>{cat.icon}</span><span className="flex-1 min-w-0"><span className="block text-xs font-semibold text-white/75 truncate">{cat.label}</span><span className="block h-1.5 rounded-full bg-white/5 mt-1.5 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${Math.max(8, (cat.amount / Math.max(topCats[0].amount, 1)) * 100)}%`, background: cat.color }} /></span></span><strong className="text-xs text-white/70">{formatShortCurrency(cat.amount)}</strong></div>)}</div></section>}
    </main>
    {editingShortcut && <ShortcutEditModal selected={shortcuts} onSave={saveShortcuts} onClose={() => setEditingShortcut(false)} />}
  </div>;
}
