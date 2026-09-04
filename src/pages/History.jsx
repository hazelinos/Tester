import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import TransactionItem from '../components/TransactionItem';
import MonthSelector from '../components/MonthSelector';
import EmptyState from '../components/EmptyState';
import { formatCurrency, isSameMonth } from '../utils/formatters';
import { ALL_CATEGORIES } from '../constants/categories';
import clsx from 'clsx';

const TYPE_FILTERS = [
  { id: 'all',     label: 'Semua'        },
  { id: 'expense', label: 'Pengeluaran'  },
  { id: 'income',  label: 'Pemasukan'    },
];

export default function History() {
  const { openEdit } = useOutletContext();
  const { transactions } = useFinance();

  const [selectedDate,    setSelectedDate]    = useState(new Date());
  const [search,          setSearch]          = useState('');
  const [typeFilter,      setTypeFilter]      = useState('all');
  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [showCatFilter,   setShowCatFilter]   = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchMonth    = isSameMonth(tx.date, selectedDate);
      const matchType     = typeFilter === 'all' || tx.type === typeFilter;
      const matchCategory = categoryFilter === 'all' || tx.categoryId === categoryFilter;
      const matchSearch   = !search || tx.note?.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchType && matchCategory && matchSearch;
    });
  }, [transactions, selectedDate, typeFilter, categoryFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((tx) => {
      const key = tx.date.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return Object.entries(map)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, txs]) => ({ date, txs }));
  }, [filtered]);

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const activeCatLabel = ALL_CATEGORIES.find(c => c.id === categoryFilter)?.label || 'Semua Kategori';

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Riwayat</h1>
        <MonthSelector date={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pemasukan',  val: totalIncome,             color: 'text-income'  },
          { label: 'Pengeluaran', val: totalExpense,            color: 'text-expense' },
          { label: 'Selisih',    val: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense' },
        ].map((s) => (
          <div key={s.label} className="card text-center py-3">
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={clsx('text-sm font-bold', s.color)}>{formatCurrency(s.val)}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50 transition-colors">
          <Search size={15} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari catatan transaksi..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder-text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-text-muted hover:text-text-secondary">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                typeFilter === f.id
                  ? 'bg-primary text-bg border-primary'
                  : 'border-border text-text-secondary hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowCatFilter(!showCatFilter)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              categoryFilter !== 'all'
                ? 'bg-primary text-bg border-primary'
                : 'border-border text-text-secondary hover:text-text-primary'
            )}
          >
            <SlidersHorizontal size={11} />
            {activeCatLabel}
          </button>
          {(typeFilter !== 'all' || categoryFilter !== 'all' || search) && (
            <button
              onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setSearch(''); }}
              className="px-3 py-1.5 rounded-full text-xs text-text-muted hover:text-text-secondary border border-dashed border-border"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Category dropdown */}
        {showCatFilter && (
          <div className="flex gap-2 flex-wrap p-3 bg-card border border-border rounded-xl">
            <button
              onClick={() => { setCategoryFilter('all'); setShowCatFilter(false); }}
              className={clsx(
                'px-2.5 py-1.5 rounded-lg text-xs border transition-all',
                categoryFilter === 'all'
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'border-border text-text-muted hover:text-text-secondary'
              )}
            >
              Semua
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryFilter(cat.id); setShowCatFilter(false); }}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
                  categoryFilter === cat.id
                    ? 'border-current'
                    : 'border-border text-text-muted hover:text-text-secondary'
                )}
                style={categoryFilter === cat.id ? { borderColor: cat.color, backgroundColor: cat.color + '22', color: cat.color } : {}}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction List */}
      {grouped.length === 0 ? (
        <EmptyState icon="🔍" title="Tidak ada transaksi" subtitle="Coba ubah filter atau pilih bulan lain" />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, txs }) => {
            const dayNet = txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-semibold text-text-muted">
                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={clsx('text-xs font-semibold', dayNet >= 0 ? 'text-income' : 'text-expense')}>
                    {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
