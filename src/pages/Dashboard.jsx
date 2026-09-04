import { useState, useMemo } from 'react';
import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, PiggyBank, Target } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import { useIsMobile } from '../hooks/useIsMobile';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';
import clsx from 'clsx';

export default function Dashboard() {
  const { openEdit }       = useOutletContext();
  const { settings }       = useSettings();
  const mobile             = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [balanceVisible, setBalanceVisible] = useState(true);

  const {
    accounts, getMonthlyIncome, getMonthlyExpense,
    getTotalBalance, getMonthlyTransactions, getExpenseByCategory,
    savings, budgets, getBudgetUsage,
  } = useFinance();

  const income   = useMemo(() => getMonthlyIncome(selectedDate),    [getMonthlyIncome, selectedDate]);
  const expense  = useMemo(() => getMonthlyExpense(selectedDate),   [getMonthlyExpense, selectedDate]);
  const balance  = useMemo(() => getTotalBalance(),                  [getTotalBalance]);
  const recentTx = useMemo(() => getMonthlyTransactions(selectedDate).slice(0, mobile ? 5 : 8), [getMonthlyTransactions, selectedDate, mobile]);
  const expByCat = useMemo(() => getExpenseByCategory(selectedDate), [getExpenseByCategory, selectedDate]);

  const savings     = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

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

  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;

  // Shortcut data
  const activeSavings   = useMemo(() => (savings || []).filter(s => s.collected < s.target).length, [savings]);
  const totalSavingGoal = useMemo(() => (savings || []).reduce((s, g) => s + g.target, 0), [savings]);
  const totalSaved      = useMemo(() => (savings || []).reduce((s, g) => s + g.collected, 0), [savings]);
  const budgetUsage     = useMemo(() => getBudgetUsage(selectedDate), [getBudgetUsage, selectedDate]);
  const overBudget      = useMemo(() => budgetUsage.filter(b => b.spent > b.amount).length, [budgetUsage]);

  // ── MOBILE ──────────────────────────────────────────────────
  if (mobile) {
    return (
      <div className="flex flex-col h-full bg-bg overflow-y-auto pb-20">
        {/* Balance hero */}
        <div className="px-4 pt-4 pb-3"
          style={{ background: 'linear-gradient(160deg, #1E3A2F 0%, #0F0F0F 100%)' }}>
          {/* Greeting + month */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-primary/80">Halo, {settings.name} 👋</p>
              <p className="text-xs text-text-muted">{settings.subtitle}</p>
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

          {/* Total uang */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-primary/70 font-medium">Total Uang</p>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-primary/60">
              {balanceVisible ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
          <p className="text-3xl font-extrabold text-white mb-3">
            {balanceVisible ? formatCurrency(balance) : 'Rp ••••••'}
          </p>

          {/* Account chips horizontal */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shrink-0"
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

        {/* Income / Expense row */}
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
                {savings >= 0 ? '💰 Tabungan' : '⚠️ Defisit'}
              </span>
              <span className="text-xs font-bold" style={{ color: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }}>
                {savings >= 0 ? '+' : ''}{formatShortCurrency(savings)} ({savingsRate}%)
              </span>
            </div>
            <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }} />
            </div>
          </div>
        )}

        {/* Shortcut — Tabungan & Budget */}
        <div className="grid grid-cols-2 gap-2 px-4 mb-3">
          <Link to="/savings" className="bg-card rounded-2xl p-3 border border-border active:bg-elevated transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <PiggyBank size={14} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-text-primary">Tabungan</span>
            </div>
            <p className="text-sm font-bold text-primary">{formatShortCurrency(totalSaved)}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {activeSavings} target aktif
            </p>
          </Link>
          <Link to="/budget" className="bg-card rounded-2xl p-3 border border-border active:bg-elevated transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-expense/10 flex items-center justify-center">
                <Target size={14} className={overBudget > 0 ? 'text-expense' : 'text-text-secondary'} />
              </div>
              <span className="text-xs font-semibold text-text-primary">Budget</span>
            </div>
            <p className={clsx('text-sm font-bold', overBudget > 0 ? 'text-expense' : 'text-text-secondary')}>
              {budgetUsage.length} kategori
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {overBudget > 0 ? `${overBudget} melebihi limit` : 'Semua aman'}
            </p>
          </Link>
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
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
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
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Halo, {settings.name} 👋</h1>
          <p className="text-text-muted text-sm mt-0.5">{settings.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-text-primary min-w-36 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {savings >= 0 ? '💰 Tabungan' : '⚠️ Defisit'}
            </h3>
            <span className="text-base font-bold" style={{ color: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }}>
              {formatCurrency(savings)}
            </span>
          </div>
          {income > 0 && (
            <>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.abs(savingsRate)}%`, backgroundColor: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }} />
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
    </div>
  );
}
