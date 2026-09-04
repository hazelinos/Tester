import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { ReportContent } from './Report';
import { formatCurrency, formatShortCurrency, isSameMonth, getMonthName } from '../utils/formatters';
import { ALL_CATEGORIES } from '../constants/categories';
import clsx from 'clsx';

const TYPE_FILTERS = [
  { id: 'all',     label: 'Semua'       },
  { id: 'expense', label: 'Pengeluaran' },
  { id: 'income',  label: 'Pemasukan'   },
];

// ── Tab bar ───────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex bg-elevated rounded-xl p-1 gap-1">
      {[
        { id: 'transactions', label: '🧾 Transaksi' },
        { id: 'report',       label: '📊 Laporan'   },
      ].map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
            active === t.id
              ? 'bg-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Transaksi Content ─────────────────────────────────────────────
function TransactionsContent({ selectedDate, openEdit, mobile }) {
  const { transactions } = useFinance();

  const [search,         setSearch]         = useState('');
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCatFilter,  setShowCatFilter]  = useState(false);

  const filtered = useMemo(() => transactions.filter((tx) => {
    const matchMonth    = isSameMonth(tx.date, selectedDate);
    const matchType     = typeFilter === 'all' || tx.type === typeFilter;
    const matchCategory = categoryFilter === 'all' || tx.categoryId === categoryFilter;
    const matchSearch   = !search || tx.note?.toLowerCase().includes(search.toLowerCase());
    return matchMonth && matchType && matchCategory && matchSearch;
  }), [transactions, selectedDate, typeFilter, categoryFilter, search]);

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

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Masuk',   val: totalIncome,              color: 'text-income'  },
          { label: 'Keluar',  val: totalExpense,             color: 'text-expense' },
          { label: 'Selisih', val: totalIncome - totalExpense,
            color: totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
            <p className="text-[10px] text-text-muted mb-0.5">{s.label}</p>
            <p className={clsx('text-xs font-bold', s.color)}>
              {mobile ? formatShortCurrency(s.val) : formatCurrency(s.val)}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50">
        <Search size={13} className="text-text-muted shrink-0" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari catatan..."
          className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder-text-muted" />
        {search && (
          <button onClick={() => setSearch('')} className="text-text-muted"><X size={13} /></button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {TYPE_FILTERS.map((f) => (
          <button key={f.id} onClick={() => setTypeFilter(f.id)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all',
              typeFilter === f.id
                ? 'bg-primary text-bg border-primary'
                : 'border-border text-text-secondary'
            )}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setShowCatFilter(!showCatFilter)}
          className={clsx(
            'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all',
            categoryFilter !== 'all'
              ? 'bg-primary text-bg border-primary'
              : 'border-border text-text-secondary'
          )}>
          <SlidersHorizontal size={11} />
          {ALL_CATEGORIES.find(c => c.id === categoryFilter)?.label || 'Kategori'}
        </button>
      </div>

      {/* Category filter */}
      {showCatFilter && (
        <div className="flex gap-1.5 flex-wrap p-2 bg-card border border-border rounded-xl">
          <button onClick={() => { setCategoryFilter('all'); setShowCatFilter(false); }}
            className={clsx('px-2 py-1 rounded-lg text-xs border transition-all',
              categoryFilter === 'all'
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'border-border text-text-muted')}>
            Semua
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => { setCategoryFilter(cat.id); setShowCatFilter(false); }}
              className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all',
                categoryFilter === cat.id ? 'border-current' : 'border-border text-text-muted')}
              style={categoryFilter === cat.id
                ? { borderColor: cat.color, backgroundColor: cat.color + '22', color: cat.color }
                : {}}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Transaction list */}
      {grouped.length === 0
        ? <EmptyState icon="🔍" title="Tidak ada transaksi" subtitle="Coba ubah filter" />
        : grouped.map(({ date, txs }) => {
            const dayNet = txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-semibold text-text-muted">
                    {new Date(date).toLocaleDateString('id-ID', {
                      weekday: 'short', day: '2-digit', month: 'short',
                    })}
                  </span>
                  <span className={clsx('text-[11px] font-semibold', dayNet >= 0 ? 'text-income' : 'text-expense')}>
                    {dayNet >= 0 ? '+' : ''}{mobile ? formatShortCurrency(dayNet) : formatCurrency(dayNet)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function History() {
  const { openEdit }      = useOutletContext();
  const mobile            = useIsMobile();
  const [activeTab,       setActiveTab]       = useState('transactions');
  const [selectedDate,    setSelectedDate]    = useState(new Date());

  const changeMonth = (dir) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;
  const padding    = mobile ? 'px-3 pb-20' : 'p-6 max-w-4xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      {/* Header: judul + month selector */}
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>
          Aktivitas Keuangan
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => changeMonth(-1)} className="p-1 text-text-muted">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-text-primary min-w-28 text-center">
            {monthLabel}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1 text-text-muted">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'transactions' ? (
        <TransactionsContent
          selectedDate={selectedDate}
          openEdit={openEdit}
          mobile={mobile}
        />
      ) : (
        <ReportContent
          selectedDate={selectedDate}
          onChangeMonth={changeMonth}
          mobile={mobile}
          embedded
        />
      )}
    </div>
  );
}
