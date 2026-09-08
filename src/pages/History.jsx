import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, CalendarDays, Filter, Copy, Trash2, Pencil, ReceiptText, BarChart3 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import ActivityTransactionItem from '../components/ActivityTransactionItem';
import ActivityReport from './ActivityReport';
import { formatCurrency, formatShortCurrency, isSameMonth, getMonthName } from '../utils/formatters';
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import clsx from 'clsx';

const TYPE_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'expense', label: 'Pengeluaran' },
  { id: 'income', label: 'Pemasukan' },
];

const monthInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const parseLocalMonth = (value) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'transactions', label: 'Transaksi', Icon: ReceiptText },
    { id: 'report', label: 'Laporan', Icon: BarChart3 },
  ];
  return (
    <div className="flex bg-elevated rounded-2xl p-1 gap-1">
      {tabs.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => onChange(id)} className={clsx('flex-1 py-3 rounded-xl flex items-center justify-center gap-2.5 text-base font-bold transition-all duration-200', active === id ? 'bg-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary')}>
          <Icon size={27} strokeWidth={2.2} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function AdvancedFilter({ value, onChange, accounts, onClose }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-text-primary">Filter lanjutan</p>
        <button onClick={onClose} className="text-text-muted"><X size={15} /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-text-muted">Dari tanggal<input type="date" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary" /></label>
        <label className="text-[10px] text-text-muted">Sampai tanggal<input type="date" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary" /></label>
        <label className="text-[10px] text-text-muted">Nominal minimum<input type="number" min="0" value={value.min} onChange={e => onChange({ ...value, min: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary" placeholder="0" /></label>
        <label className="text-[10px] text-text-muted">Nominal maksimum<input type="number" min="0" value={value.max} onChange={e => onChange({ ...value, max: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary" placeholder="Tanpa batas" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] text-text-muted">Kategori<select value={value.category} onChange={e => onChange({ ...value, category: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary"><option value="all">Semua kategori</option>{ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></label>
        <label className="text-[10px] text-text-muted">Akun<select value={value.account} onChange={e => onChange({ ...value, account: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary"><option value="all">Semua akun</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}</select></label>
      </div>
      <label className="text-[10px] text-text-muted">Urutan<select value={value.sort} onChange={e => onChange({ ...value, sort: e.target.value })} className="mt-1 w-full bg-input border border-border rounded-lg px-2 py-2 text-xs text-text-primary"><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="highest">Nominal terbesar</option><option value="lowest">Nominal terkecil</option></select></label>
      <button onClick={() => onChange({ from: '', to: '', min: '', max: '', category: 'all', account: 'all', sort: 'newest' })} className="text-[11px] text-text-muted hover:text-text-primary">Reset filter</button>
    </div>
  );
}

function DetailSheet({ tx, accounts, onClose, onEdit, onDuplicate, onDelete }) {
  if (!tx) return null;
  const cat = ALL_CATEGORIES.find(c => c.id === tx.categoryId);
  const account = accounts.find(a => a.id === tx.accountId);
  const isIncome = tx.type === 'income';
  const date = new Date(tx.date);
  const time = tx.createdAt ? new Date(tx.createdAt) : date;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat?.color || '#AAAAAA'}22` }}>{cat?.icon || '📦'}</div>
          <div className="flex-1 min-w-0"><p className="font-bold text-text-primary truncate">{tx.note || cat?.label || 'Transaksi'}</p><p className="text-xs text-text-muted mt-1">{cat?.label || 'Lainnya'} · {isIncome ? 'Pemasukan' : 'Pengeluaran'}</p></div>
          <p className={clsx('font-bold text-base', isIncome ? 'text-income' : 'text-expense')}>{isIncome ? '+' : '-'}{formatCurrency(tx.amount)}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[['Tanggal', date.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })], ['Waktu', time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })], ['Akun', account?.name || '—'], ['Jenis transaksi', isIncome ? 'Pemasukan' : 'Pengeluaran']].map(([label, value]) => <div key={label} className="bg-elevated rounded-xl p-3"><p className="text-[10px] text-text-muted">{label}</p><p className="text-xs font-semibold text-text-primary mt-1 break-words">{value}</p></div>)}
        </div>
        <div className="bg-elevated rounded-xl p-3 mt-2"><p className="text-[10px] text-text-muted">Catatan</p><p className="text-sm text-text-primary mt-1">{tx.note || 'Tidak ada catatan'}</p></div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button onClick={() => onEdit(tx)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-elevated text-text-primary text-xs font-semibold"><Pencil size={14} /> Edit</button>
          <button onClick={() => onDuplicate(tx)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-elevated text-text-primary text-xs font-semibold"><Copy size={14} /> Duplikat</button>
          <button onClick={() => onDelete(tx)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-expense/10 text-expense text-xs font-semibold"><Trash2 size={14} /> Hapus</button>
        </div>
      </div>
    </div>
  );
}

function CategoryPicker({ typeFilter, transactions, categoryFilter, onSelect }) {
  const categories = typeFilter === 'expense' ? EXPENSE_CATEGORIES : typeFilter === 'income' ? INCOME_CATEGORIES : ALL_CATEGORIES;
  const categoryUsage = useMemo(() => {
    const counts = {};
    transactions.forEach(tx => {
      if (tx.categoryId && (typeFilter === 'all' || tx.type === typeFilter)) counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1;
    });
    return counts;
  }, [transactions, typeFilter]);
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => {
    const usageDiff = (categoryUsage[b.id] || 0) - (categoryUsage[a.id] || 0);
    return usageDiff || categories.indexOf(a) - categories.indexOf(b);
  }), [categories, categoryUsage]);
  const rows = Math.min(3, Math.max(1, Math.ceil(sortedCategories.length / 5)));
  const columns = useMemo(() => {
    const result = [];
    for (let i = 0; i < sortedCategories.length; i += rows) result.push(sortedCategories.slice(i, i + rows));
    return result;
  }, [sortedCategories, rows]);

  return (
    <div className="bg-card border border-border rounded-2xl p-2.5 space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-text-primary">Kategori</p>
          <p className="text-[9px] text-text-muted">Diurutkan dari yang paling sering digunakan</p>
        </div>
        <span className="text-[9px] text-text-muted">{sortedCategories.length} kategori</span>
      </div>
      <div className="overflow-x-auto scrollbar-none -mx-0.5 px-0.5 pb-0.5 snap-x">
        <div className="flex gap-1.5 w-max">
          {columns.map((column, index) => (
            <div key={index} className="grid gap-1.5 shrink-0" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
              {column.map((cat, catIndex) => {
                const rank = index * rows + catIndex + 1;
                const isSelected = categoryFilter === cat.id;
                return (
                  <button key={cat.id} type="button" onClick={() => onSelect(cat.id)} className={clsx('w-[92px] h-[42px] rounded-xl border bg-input flex items-center gap-1.5 px-2 text-left transition-all shrink-0', isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary')}>
                    <span className="text-[17px] leading-none shrink-0">{cat.icon}</span>
                    <span className="min-w-0 flex-1 text-[9px] leading-tight font-medium line-clamp-2">{cat.label}</span>
                    {rank === 1 && <span className="text-[8px] font-bold text-primary shrink-0">#1</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransactionsContent({ selectedDate, openEdit, mobile, onOpenDetail, categoryFilter, setCategoryFilter, typeFilter, setTypeFilter, search, setSearch, advanced, setAdvanced, filters, setFilters }) {
  const { transactions, accounts } = useFinance();
  const monthTransactions = useMemo(() => transactions.filter(tx => isSameMonth(tx.date, selectedDate)), [transactions, selectedDate]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthTransactions.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && categoryFilter !== '__open__' && tx.categoryId !== categoryFilter) return false;
      if (filters.category !== 'all' && tx.categoryId !== filters.category) return false;
      if (filters.account !== 'all' && tx.accountId !== filters.account) return false;
      const amount = Number(tx.amount) || 0;
      if (filters.min && amount < Number(filters.min)) return false;
      if (filters.max && amount > Number(filters.max)) return false;
      const day = tx.date.slice(0, 10);
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      if (q) {
        const cat = ALL_CATEGORIES.find(c => c.id === tx.categoryId);
        const haystack = `${tx.note || ''} ${cat?.label || ''} ${amount}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (filters.sort === 'oldest') return new Date(a.date) - new Date(b.date);
      if (filters.sort === 'highest') return Number(b.amount) - Number(a.amount);
      if (filters.sort === 'lowest') return Number(a.amount) - Number(b.amount);
      return new Date(b.date) - new Date(a.date);
    });
  }, [monthTransactions, typeFilter, categoryFilter, search, filters]);
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(tx => { const key = tx.date.slice(0, 10); (map[key] ||= []).push(tx); });
    return Object.entries(map).sort(([a], [b]) => new Date(b) - new Date(a)).map(([date, txs]) => ({ date, txs }));
  }, [filtered]);
  const hasActiveAdvanced = filters.from || filters.to || filters.min || filters.max || filters.category !== 'all' || filters.account !== 'all' || filters.sort !== 'newest';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">{[['Masuk', totalIncome, 'text-income'], ['Keluar', totalExpense, 'text-expense'], ['Selisih', totalIncome - totalExpense, totalIncome - totalExpense >= 0 ? 'text-income' : 'text-expense']].map(([label, value, color]) => <div key={label} className="bg-card border border-border rounded-2xl p-2.5 text-center"><p className="text-[10px] text-text-muted">{label}</p><p className={clsx('text-xs font-bold mt-1', color)}>{value < 0 ? '-' : ''}{mobile ? formatShortCurrency(Math.abs(value)) : formatCurrency(Math.abs(value))}</p></div>)}</div>
      <div className="flex items-center gap-2 bg-input border border-border rounded-2xl px-3 py-2.5 focus-within:border-primary/50"><Search size={15} className="text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari transaksi, kategori, nominal..." className="flex-1 bg-transparent text-sm focus:outline-none text-text-primary placeholder-text-muted" />{search && <button onClick={() => setSearch('')}><X size={14} className="text-text-muted" /></button>}</div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">{TYPE_FILTERS.map(f => <button key={f.id} onClick={() => { setTypeFilter(f.id); if (categoryFilter !== 'all') setCategoryFilter('__open__'); }} className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 transition-all', typeFilter === f.id ? 'bg-primary text-bg border-primary' : 'border-border text-text-secondary')}>{f.label}</button>)}<button onClick={() => setCategoryFilter(categoryFilter === 'all' ? '__open__' : 'all')} className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0', categoryFilter !== 'all' && categoryFilter !== '__open__' ? 'bg-primary text-bg border-primary' : 'border-border text-text-secondary')}>Kategori</button><button onClick={() => setAdvanced(!advanced)} className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0', advanced || hasActiveAdvanced ? 'bg-primary/15 text-primary border-primary/40' : 'border-border text-text-secondary')}><Filter size={12} /> Filter</button></div>
      {categoryFilter === '__open__' && <CategoryPicker typeFilter={typeFilter} transactions={transactions} categoryFilter={categoryFilter} onSelect={setCategoryFilter} />}
      {categoryFilter !== 'all' && categoryFilter !== '__open__' && <CategoryPicker typeFilter={typeFilter} transactions={transactions} categoryFilter={categoryFilter} onSelect={setCategoryFilter} />}
      {advanced && <AdvancedFilter value={filters} onChange={setFilters} accounts={accounts} onClose={() => setAdvanced(false)} />}
      {grouped.length === 0 ? <div className="bg-card border border-border rounded-2xl p-8 text-center"><p className="text-2xl">{monthTransactions.length ? '🔎' : '🧾'}</p><p className="font-semibold text-text-primary mt-2">{monthTransactions.length ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi bulan ini'}</p><p className="text-xs text-text-muted mt-1">{monthTransactions.length ? 'Coba ubah pencarian atau filter.' : 'Tambahkan transaksi pertama kamu.'}</p></div> : grouped.map(({ date, txs }) => { const dayNet = txs.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0); return <section key={date}><div className="flex items-center justify-between px-1 mb-1.5"><div><p className="text-[11px] font-bold text-text-secondary">{new Date(`${date}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p><p className="text-[10px] text-text-muted">{txs.length} transaksi</p></div><p className={clsx('text-[11px] font-bold', dayNet >= 0 ? 'text-income' : 'text-expense')}>{dayNet >= 0 ? '+' : '-'}{mobile ? formatShortCurrency(Math.abs(dayNet)) : formatCurrency(Math.abs(dayNet))}</p></div><div className="space-y-1.5">{txs.map(tx => <ActivityTransactionItem key={tx.id} transaction={tx} onEdit={openEdit} onOpenDetail={onOpenDetail} />)}</div></section>; })}
    </div>
  );
}

export default function History() {
  const { openEdit } = useOutletContext();
  const { transactions, accounts, addTransaction, deleteTransaction } = useFinance();
  const mobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [advanced, setAdvanced] = useState(false);
  const [detailTx, setDetailTx] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', min: '', max: '', category: 'all', account: 'all', sort: 'newest' });
  const changeMonth = dir => { const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + dir, 1); setSelectedDate(d); };
  const pickMonth = value => setSelectedDate(parseLocalMonth(value));
  const duplicate = tx => { const { id, createdAt, ...data } = tx; addTransaction(data); setDetailTx(null); };
  const remove = tx => { if (window.confirm('Hapus transaksi ini?')) { deleteTransaction(tx.id); setDetailTx(null); } };
  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;
  return <div className={clsx('space-y-3 pt-3', mobile ? 'px-3 pb-24' : 'p-6 max-w-4xl mx-auto')}>
    <div className="flex items-center justify-between gap-3"><p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>Aktivitas Keuangan</p><div className="flex items-center gap-0.5 bg-card border border-border rounded-xl px-1"><button onClick={() => changeMonth(-1)} className="p-1.5 text-text-muted"><ChevronLeft size={15}/></button><label className="relative flex items-center gap-1 px-1 cursor-pointer"><CalendarDays size={13} className="text-primary"/><span className="text-xs font-semibold text-text-primary min-w-24 text-center">{monthLabel}</span><input type="month" value={monthInputValue(selectedDate)} onChange={e => pickMonth(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer"/></label><button onClick={() => changeMonth(1)} className="p-1.5 text-text-muted"><ChevronRight size={15}/></button></div></div>
    <TabBar active={activeTab} onChange={setActiveTab}/>
    {activeTab === 'transactions' ? <TransactionsContent selectedDate={selectedDate} openEdit={tx => openEdit(tx)} mobile={mobile} onOpenDetail={setDetailTx} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} typeFilter={typeFilter} setTypeFilter={setTypeFilter} search={search} setSearch={setSearch} advanced={advanced} setAdvanced={setAdvanced} filters={filters} setFilters={setFilters}/> : <ActivityReport selectedDate={selectedDate} onCategorySelect={cat => { setCategoryFilter(cat); setActiveTab('transactions'); }}/>} 
    <DetailSheet tx={detailTx} accounts={accounts} onClose={() => setDetailTx(null)} onEdit={tx => { setDetailTx(null); openEdit(tx); }} onDuplicate={duplicate} onDelete={remove}/>
  </div>;
}
