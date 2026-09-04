import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Eye, EyeOff, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  PiggyBank, Target, Pencil, Check, X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useIsMobile } from '../hooks/useIsMobile';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

// ── Inline editable text ──────────────────────────────────────────
function EditableText({ value, onSave, className, inputClassName, placeholder, maxLength = 50 }) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(value);

  const commit = () => {
    onSave(draft.trim() || value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter')  commit();
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
          maxLength={maxLength}
          placeholder={placeholder}
          className={clsx(
            'bg-transparent border-b border-primary/60 focus:outline-none text-text-primary',
            inputClassName
          )}
        />
        <button onClick={commit} className="p-1 rounded-lg bg-primary/20 text-primary">
          <Check size={12} />
        </button>
        <button onClick={() => { setDraft(value); setEditing(false); }}
          className="p-1 rounded-lg hover:bg-elevated text-text-muted">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className={className}>{value}</span>
      <Pencil size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  );
}

// ── Semua opsi shortcut yang tersedia ────────────────────────────
const SHORTCUT_OPTIONS = [
  { id: '/savings',       label: 'Tabungan',  icon: '🐷', color: '#A8E6CF' },
  { id: '/budget',        label: 'Budget',    icon: '🎯', color: '#FFD369' },
  { id: '/debt',          label: 'Hutang',    icon: '🏦', color: '#FF6B6B' },
  { id: '/subscriptions', label: 'Langganan', icon: '📡', color: '#69B4FF' },
  { id: '/history',       label: 'Aktivitas', icon: '🧾', color: '#C469FF' },
  { id: '/report',        label: 'Laporan',   icon: '📊', color: '#6BCF9F' },
  { id: '/accounts',      label: 'Akun',      icon: '💳', color: '#FFB347' },
];

const DEFAULT_SHORTCUTS = ['/savings', '/budget', '/debt', '/subscriptions'];
const STORAGE_KEY = 'dashboard_shortcuts';

const loadShortcuts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS;
  } catch { return DEFAULT_SHORTCUTS; }
};

// ── Shortcut Edit Modal ───────────────────────────────────────────
function ShortcutEditModal({ selected, onSave, onClose }) {
  const [picks, setPicks] = useState(selected);

  const toggle = (id) => {
    if (picks.includes(id)) {
      if (picks.length <= 2) return; // min 2
      setPicks(picks.filter(p => p !== id));
    } else {
      if (picks.length >= 4) return; // max 4
      setPicks([...picks, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">Edit Shortcut</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-text-muted">Pilih 2–4 shortcut untuk ditampilkan di dashboard</p>
          <div className="grid grid-cols-2 gap-2">
            {SHORTCUT_OPTIONS.map((opt) => {
              const isSelected = picks.includes(opt.id);
              const disabled   = !isSelected && picks.length >= 4;
              return (
                <button
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  disabled={disabled}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    isSelected
                      ? 'border-primary/60 bg-primary/10'
                      : disabled
                        ? 'border-border bg-input opacity-40 cursor-not-allowed'
                        : 'border-border bg-input hover:bg-elevated'
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-xs font-semibold', isSelected ? 'text-primary' : 'text-text-primary')}>
                      {opt.label}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check size={10} className="text-bg" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { onSave(picks); onClose(); }}
            className="btn-primary w-full py-3 mt-2"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Render satu shortcut card ─────────────────────────────────────
function ShortcutCard({ optId, savingsGoals, budgetUsage, overBudget }) {
  const opt = SHORTCUT_OPTIONS.find(o => o.id === optId);
  if (!opt) return null;

  // Data dinamis per shortcut
  let value = '';
  let sub   = '';

  if (optId === '/savings') {
    const active = (savingsGoals || []).filter(s => s.collected < s.target).length;
    const saved  = (savingsGoals || []).reduce((s, g) => s + g.collected, 0);
    value = formatShortCurrency(saved);
    sub   = `${active} target aktif`;
  } else if (optId === '/budget') {
    value = `${budgetUsage.length} kategori`;
    sub   = overBudget > 0 ? `${overBudget} melebihi limit` : 'Semua aman';
  } else if (optId === '/debt') {
    value = 'Kelola';
    sub   = 'Hutang & cicilan';
  } else if (optId === '/subscriptions') {
    value = 'Kelola';
    sub   = 'Langganan rutin';
  } else if (optId === '/history') {
    value = 'Lihat';
    sub   = 'Semua aktivitas';
  } else if (optId === '/report') {
    value = 'Lihat';
    sub   = 'Laporan keuangan';
  } else if (optId === '/accounts') {
    value = 'Kelola';
    sub   = 'Daftar akun';
  }

  return (
    <Link
      to={optId}
      className="bg-card rounded-2xl p-3 border border-border active:bg-elevated transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: opt.color + '22' }}
        >
          {opt.icon}
        </div>
        <span className="text-xs font-semibold text-text-primary">{opt.label}</span>
      </div>
      <p className="text-sm font-bold" style={{ color: opt.color }}>{value}</p>
      <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { openEdit }   = useOutletContext();
  const { settings, updateSettings }   = useSettings();
  const mobile         = useIsMobile();

  const [selectedDate,    setSelectedDate]    = useState(new Date());
  const [balanceVisible,  setBalanceVisible]  = useState(true);
  const [shortcuts,       setShortcuts]       = useState(loadShortcuts);
  const [editingShortcut, setEditingShortcut] = useState(false);

  const {
    accounts, getMonthlyIncome, getMonthlyExpense,
    getTotalBalance, getMonthlyTransactions, getExpenseByCategory,
    savings: savingsGoals, getBudgetUsage,
  } = useFinance();

  const income        = useMemo(() => getMonthlyIncome(selectedDate),    [getMonthlyIncome, selectedDate]);
  const expense       = useMemo(() => getMonthlyExpense(selectedDate),   [getMonthlyExpense, selectedDate]);
  const balance       = useMemo(() => getTotalBalance(),                  [getTotalBalance]);
  const recentTx      = useMemo(() => getMonthlyTransactions(selectedDate).slice(0, mobile ? 5 : 8), [getMonthlyTransactions, selectedDate, mobile]);
  const expByCat      = useMemo(() => getExpenseByCategory(selectedDate), [getExpenseByCategory, selectedDate]);
  const budgetUsage   = useMemo(() => getBudgetUsage(selectedDate),       [getBudgetUsage, selectedDate]);
  const overBudget    = useMemo(() => budgetUsage.filter(b => b.spent > b.amount).length, [budgetUsage]);

  const monthlySavings = income - expense;
  const savingsRate    = income > 0 ? Math.round((monthlySavings / income) * 100) : 0;

  const topCats = useMemo(() =>
    Object.entries(expByCat)
      .map(([id, amount]) => ({ ...getCategoryById(id), amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3),
    [expByCat]
  );

  const changeMonth = (dir) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const saveShortcuts = (picks) => {
    setShortcuts(picks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  };

  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;

  // ── MOBILE ──────────────────────────────────────────────────
  if (mobile) {
    return (
      <div className="flex flex-col h-full bg-bg overflow-y-auto pb-20">
        {/* Balance hero */}
        <div className="px-4 pt-4 pb-3"
          style={{ background: 'linear-gradient(160deg, #1E3A2F 0%, #0F0F0F 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <EditableText
                value={settings.name}
                onSave={(val) => updateSettings({ name: val })}
                className="text-xs font-semibold text-primary/80"
                inputClassName="text-xs font-semibold text-primary/80 w-36"
                placeholder="Nama kamu"
                maxLength={30}
              />
              <EditableText
                value={settings.subtitle}
                onSave={(val) => updateSettings({ subtitle: val || settings.subtitle })}
                className="text-xs text-text-muted"
                inputClassName="text-xs text-text-muted w-44"
                placeholder="Subtitle dashboard"
                maxLength={60}
              />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => changeMonth(-1)} className="p-1 text-text-muted">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-text-secondary font-medium min-w-24 text-center">{monthLabel}</span>
              <button onClick={() => changeMonth(1)} className="p-1 text-text-muted">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-primary/70 font-medium">Total Uang</p>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-primary/60">
              {balanceVisible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
          <p className="text-3xl font-extrabold text-white mb-3">
            {balanceVisible ? formatCurrency(balance) : 'Rp ••••••'}
          </p>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc) => (
              <div key={acc.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shrink-0"
                style={{ borderColor: acc.color + '44', backgroundColor: acc.color + '15' }}>
                <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: acc.color + '33' }}>
                  {acc.iconType === 'photo' && acc.iconPhoto
                    ? <img src={acc.iconPhoto} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px]">{acc.icon}</span>}
                </div>
                <span className="text-xs font-medium" style={{ color: acc.color }}>
                  {balanceVisible ? formatShortCurrency(acc.balance) : '••••'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Income / Expense */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <div className="bg-card rounded-2xl p-3 border border-income/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={13} className="text-income" />
              <span className="text-xs text-text-muted">Pemasukan</span>
            </div>
            <p className="text-base font-bold text-income">{formatShortCurrency(income)}</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-expense/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={13} className="text-expense" />
              <span className="text-xs text-text-muted">Pengeluaran</span>
            </div>
            <p className="text-base font-bold text-expense">{formatShortCurrency(expense)}</p>
          </div>
        </div>

        {/* Savings bar */}
        {income > 0 && (
          <div className="mx-4 bg-card rounded-2xl p-3 border border-border mb-3">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-muted">
                {monthlySavings >= 0 ? 'Saldo Bulan Ini' : 'Defisit'}
              </span>
              <span className="text-xs font-bold"
                style={{ color: monthlySavings >= 0 ? '#A8E6CF' : '#FF6B6B' }}>
                {monthlySavings >= 0 ? '+' : ''}{formatShortCurrency(monthlySavings)} ({savingsRate}%)
              </span>
            </div>
            <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: monthlySavings >= 0 ? '#A8E6CF' : '#FF6B6B' }} />
            </div>
          </div>
        )}

        {/* ── Shortcut Grid ──────────────────────── */}
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-primary">Shortcut</p>
            <button
              onClick={() => setEditingShortcut(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors"
            >
              <Pencil size={11} /> Edit
            </button>
          </div>
          <div className={clsx(
            'grid gap-2',
            shortcuts.length <= 2 ? 'grid-cols-2' : shortcuts.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          )}>
            {shortcuts.map((id) => (
              <ShortcutCard
                key={id}
                optId={id}
                savingsGoals={savingsGoals}
                budgetUsage={budgetUsage}
                overBudget={overBudget}
              />
            ))}
          </div>
        </div>

        {/* Top spending */}
        {topCats.length > 0 && (
          <div className="mx-4 bg-card rounded-2xl p-3 border border-border mb-3">
            <p className="text-xs font-semibold text-text-primary mb-2">Top Pengeluaran</p>
            <div className="space-y-2">
              {topCats.map((cat) => {
                const pct = expense > 0 ? (cat.amount / expense) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <span className="text-base w-6 text-center">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-text-secondary">{cat.label}</span>
                        <span className="text-xs font-semibold text-text-primary">{formatShortCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div className="mx-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-primary">Transaksi Terkini</p>
            <Link to="/history" className="text-xs text-primary">Lihat semua →</Link>
          </div>
          {recentTx.length === 0
            ? <EmptyState icon="📋" title="Belum ada transaksi" subtitle="Tap + untuk tambah" />
            : <div className="space-y-1.5">
                {recentTx.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} onEdit={openEdit} />
                ))}
              </div>
          }
        </div>

        {/* Edit shortcut modal */}
        {editingShortcut && (
          <ShortcutEditModal
            selected={shortcuts}
            onSave={saveShortcuts}
            onClose={() => setEditingShortcut(false)}
          />
        )}
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <EditableText
            value={settings.name}
            onSave={(val) => updateSettings({ name: val })}
            className="text-2xl font-bold text-text-primary"
            inputClassName="text-2xl font-bold w-56"
            placeholder="Nama kamu"
            maxLength={30}
          />
          <EditableText
            value={settings.subtitle}
            onSave={(val) => updateSettings({ subtitle: val || settings.subtitle })}
            className="text-text-muted text-sm mt-0.5"
            inputClassName="text-sm text-text-muted w-64 mt-0.5"
            placeholder="Subtitle dashboard"
            maxLength={60}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-text-primary min-w-36 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl p-5 border border-primary/20"
          style={{ background: 'linear-gradient(135deg, #1E3A2F, #0F2A1E)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-primary/80 font-medium">Total Uang</span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-primary/60">
              {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
          <p className="text-3xl font-extrabold text-text-primary mb-4">
            {balanceVisible ? formatCurrency(balance) : 'Rp ••••••'}
          </p>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: acc.iconType === 'photo' ? '#2A2A2A' : acc.color + '33' }}>
                    {acc.iconType === 'photo' && acc.iconPhoto
                      ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                      : <span className="text-xs">{acc.icon}</span>}
                  </div>
                  <span className="text-xs text-text-secondary">{acc.name}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: acc.color }}>
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-income/10 flex items-center justify-center">
            <TrendingDown size={20} className="text-income" />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Pemasukan Bulan Ini</p>
            <p className="text-xl font-bold text-income">{formatCurrency(income)}</p>
          </div>
        </div>

        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-expense/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-expense" />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-xl font-bold text-expense">{formatCurrency(expense)}</p>
          </div>
        </div>
      </div>

      {/* Shortcut desktop */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Shortcut</h3>
          <button onClick={() => setEditingShortcut(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors">
            <Pencil size={11} /> Edit
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {shortcuts.map((id) => (
            <ShortcutCard key={id} optId={id} savingsGoals={savingsGoals} budgetUsage={budgetUsage} overBudget={overBudget} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {monthlySavings >= 0 ? 'Saldo Bulan Ini' : 'Defisit'}
            </h3>
            <span className="text-base font-bold" style={{ color: monthlySavings >= 0 ? '#A8E6CF' : '#FF6B6B' }}>
              {formatCurrency(monthlySavings)}
            </span>
          </div>
          {income > 0 && (
            <>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: monthlySavings >= 0 ? '#A8E6CF' : '#FF6B6B' }} />
              </div>
              <p className="text-xs text-text-muted">{savingsRate}% dari pemasukan</p>
            </>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Top Pengeluaran</h3>
          {topCats.length === 0
            ? <p className="text-xs text-text-muted text-center py-4">Belum ada</p>
            : topCats.map((cat) => {
                const pct = expense > 0 ? (cat.amount / expense) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{cat.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-text-secondary">{cat.label}</span>
                        <span className="text-xs font-semibold">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Transaksi Terkini</h3>
          <Link to="/history" className="text-xs text-primary">Lihat Semua →</Link>
        </div>
        {recentTx.length === 0
          ? <EmptyState icon="📋" title="Belum ada transaksi" />
          : <div className="space-y-2">
              {recentTx.map((tx) => <TransactionItem key={tx.id} transaction={tx} onEdit={openEdit} />)}
            </div>
        }
      </div>

      {editingShortcut && (
        <ShortcutEditModal
          selected={shortcuts}
          onSave={saveShortcuts}
          onClose={() => setEditingShortcut(false)}
        />
      )}
    </div>
  );
}
