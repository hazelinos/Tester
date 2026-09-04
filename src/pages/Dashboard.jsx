import { useState, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import TransactionItem from '../components/TransactionItem';
import MonthSelector from '../components/MonthSelector';
import EmptyState from '../components/EmptyState';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { getCategoryById } from '../constants/categories';

export default function Dashboard() {
  const { openEdit }        = useOutletContext();
  const { settings }        = useSettings();
  const [selectedDate,    setSelectedDate]    = useState(new Date());
  const [balanceVisible,  setBalanceVisible]  = useState(true);

  const {
    accounts, getMonthlyIncome, getMonthlyExpense,
    getTotalBalance, getMonthlyTransactions, getExpenseByCategory,
  } = useFinance();

  const income    = useMemo(() => getMonthlyIncome(selectedDate),    [getMonthlyIncome, selectedDate]);
  const expense   = useMemo(() => getMonthlyExpense(selectedDate),   [getMonthlyExpense, selectedDate]);
  const balance   = useMemo(() => getTotalBalance(),                  [getTotalBalance]);
  const recentTx  = useMemo(() => getMonthlyTransactions(selectedDate).slice(0, 8), [getMonthlyTransactions, selectedDate]);
  const expByCat  = useMemo(() => getExpenseByCategory(selectedDate), [getExpenseByCategory, selectedDate]);

  const savings     = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  // Top 3 spending categories
  const topCats = useMemo(() =>
    Object.entries(expByCat)
      .map(([id, amount]) => ({ ...getCategoryById(id), amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3),
    [expByCat]
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ───────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-text-primary">
            Halo, {settings.name} 👋
          </h1>
          <p className="text-text-muted text-sm">{settings.subtitle}</p>
        </div>
        <MonthSelector date={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* ── Top Row ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance Card */}
        <div className="lg:col-span-1 rounded-2xl p-5 border border-primary/20"
          style={{ background: 'linear-gradient(135deg, #1E3A2F, #0F2A1E)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-primary/80 font-medium">Total Uang</span>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-primary/60 hover:text-primary transition-colors"
            >
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
                  <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center shrink-0"
                    style={{ backgroundColor: acc.iconType === 'photo' ? '#2A2A2A' : acc.color + '33' }}>
                    {acc.iconType === 'photo' && acc.iconPhoto
                      ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                      : <span className="text-xs">{acc.icon}</span>
                    }
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

        {/* Income */}
        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-income/10 flex items-center justify-center">
            <TrendingDown size={20} className="text-income" />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Pemasukan Bulan Ini</p>
            <p className="text-xl font-bold text-income">{formatCurrency(income)}</p>
          </div>
          <div className="mt-auto pt-2 border-t border-border">
            <p className="text-xs text-text-muted">
              {getMonthName(selectedDate.getMonth())} {selectedDate.getFullYear()}
            </p>
          </div>
        </div>

        {/* Expense */}
        <div className="card flex flex-col gap-3">
          <div className="w-10 h-10 rounded-xl bg-expense/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-expense" />
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Pengeluaran Bulan Ini</p>
            <p className="text-xl font-bold text-expense">{formatCurrency(expense)}</p>
          </div>
          <div className="mt-auto pt-2 border-t border-border">
            <p className="text-xs text-text-muted">
              {getMonthName(selectedDate.getMonth())} {selectedDate.getFullYear()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Savings + Top Spending ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Savings Rate */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {savings >= 0 ? '💰 Tabungan Bulan Ini' : '⚠️ Defisit Bulan Ini'}
            </h3>
            <span
              className="text-base font-bold"
              style={{ color: savings >= 0 ? '#A8E6CF' : '#FF6B6B' }}
            >
              {savings >= 0 ? '+' : ''}{formatCurrency(savings)}
            </span>
          </div>
          {income > 0 && (
            <>
              <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.abs(savingsRate)}%`,
                    backgroundColor: savings >= 0 ? '#A8E6CF' : '#FF6B6B',
                  }}
                />
              </div>
              <p className="text-xs text-text-muted">
                {savings >= 0
                  ? `${savingsRate}% dari pemasukan berhasil ditabung`
                  : `Pengeluaran melebihi pemasukan ${Math.abs(savingsRate)}%`}
              </p>
            </>
          )}
          {income === 0 && (
            <p className="text-xs text-text-muted">Belum ada pemasukan bulan ini</p>
          )}
        </div>

        {/* Top Spending */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Top Pengeluaran</h3>
          {topCats.length === 0 ? (
            <p className="text-xs text-text-muted py-4 text-center">Belum ada pengeluaran</p>
          ) : (
            topCats.map((cat) => {
              const pct = expense > 0 ? (cat.amount / expense) * 100 : 0;
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{cat.icon}</span>
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Recent Transactions ───────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Transaksi Terkini</h3>
          <Link to="/history" className="text-xs text-primary hover:text-primary-dark transition-colors">
            Lihat Semua →
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <EmptyState icon="📋" title="Belum ada transaksi" subtitle="Klik Tambah untuk mencatat transaksi pertama" />
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
