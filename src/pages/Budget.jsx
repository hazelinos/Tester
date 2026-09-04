import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { EXPENSE_CATEGORIES, getCategoryById } from '../constants/categories';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, getMonthName } from '../utils/formatters';
import clsx from 'clsx';

function BudgetModal({ onClose, onSave, existing, month, year }) {
  const [categoryId, setCategoryId] = useState(existing?.categoryId || '');
  const [amount, setAmount]         = useState(existing?.amount ? String(existing.amount) : '');
  const handleSave = () => {
    if (!categoryId) return alert('Pilih kategori dulu');
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah yang valid');
    onSave({ categoryId, amount: num, month, year });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{existing ? 'Edit Budget' : 'Tambah Budget'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2">Kategori</p>
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                  className={clsx('flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all',
                    categoryId === cat.id ? 'border-current' : 'border-border bg-input')}
                  style={categoryId === cat.id ? { borderColor: cat.color, backgroundColor: cat.color + '22', color: cat.color } : {}}>
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-center leading-tight text-[10px]">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1.5">Jumlah Budget</p>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none" />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan</button>
        </div>
      </div>
    </div>
  );
}

export default function Budget() {
  const mobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const { getBudgetUsage, setBudget, deleteBudget } = useFinance();

  const month = selectedDate.getMonth() + 1;
  const year  = selectedDate.getFullYear();
  const monthLabel = `${getMonthName(selectedDate.getMonth())} ${selectedDate.getFullYear()}`;

  const changeMonth = (dir) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const budgetUsage  = useMemo(() => getBudgetUsage(selectedDate), [getBudgetUsage, selectedDate]);
  const itemsWithCat = budgetUsage.map((b) => {
    const cat = getCategoryById(b.categoryId);
    return { ...b, label: cat.label, icon: cat.icon, color: cat.color };
  });

  const totalBudget = itemsWithCat.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = itemsWithCat.reduce((s, b) => s + b.spent, 0);
  const overCount   = itemsWithCat.filter((b) => b.spent > b.amount).length;

  const handleSave   = (data) => setBudget({ ...data, month, year });
  const handleDelete = (id) => { if (window.confirm('Hapus budget ini?')) deleteBudget(id); };
  const handleEdit   = (item) => { setEditItem(item); setShowModal(true); };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-3xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>Budget</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => changeMonth(-1)} className="p-1 text-text-muted"><ChevronLeft size={16} /></button>
            <span className="text-xs font-semibold text-text-primary min-w-24 text-center">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1 text-text-muted"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
            <Plus size={13} /> Tambah
          </button>
        </div>
      </div>

      {/* Summary */}
      {itemsWithCat.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { label: 'Total',    val: totalBudget,              color: 'text-text-primary' },
              { label: 'Terpakai', val: totalSpent,               color: 'text-expense'      },
              { label: 'Sisa',     val: totalBudget - totalSpent, color: 'text-income'       },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] text-text-muted mb-0.5">{s.label}</p>
                <p className={clsx('text-xs font-bold', s.color)}>
                  {mobile ? formatShortCurrency(s.val) : formatCurrency(s.val)}
                </p>
              </div>
            ))}
          </div>
          {/* Overall progress */}
          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%`,
                backgroundColor: totalSpent > totalBudget ? '#FF6B6B' : '#A8E6CF',
              }} />
          </div>
          {overCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle size={12} className="text-expense" />
              <p className="text-xs text-expense">{overCount} kategori melebihi budget</p>
            </div>
          )}
        </div>
      )}

      {/* Budget list */}
      {itemsWithCat.length === 0
        ? <EmptyState icon="🎯" title="Belum ada budget" subtitle="Tap Tambah untuk set budget" />
        : <div className={clsx('grid gap-2', mobile ? 'grid-cols-1' : 'grid-cols-2')}>
            {itemsWithCat.map((item) => {
              const isOver    = item.spent > item.amount;
              const isWarning = !isOver && item.percentage >= 80;
              const barColor  = isOver ? '#FF6B6B' : isWarning ? '#FFD3A5' : '#A8E6CF';
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: item.color + '22' }}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{item.label}</p>
                      <p className="text-[10px] text-text-muted">
                        {mobile ? formatShortCurrency(item.spent) : formatCurrency(item.spent)} / {mobile ? formatShortCurrency(item.amount) : formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-1 rounded-lg hover:bg-elevated text-text-muted">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: barColor }} />
                  </div>
                  <div className="flex justify-between">
                    <span className={clsx('text-[10px]', isOver ? 'text-expense' : 'text-text-muted')}>
                      {isOver ? `⚠️ +${mobile ? formatShortCurrency(item.spent - item.amount) : formatCurrency(item.spent - item.amount)}`
                        : `Sisa ${mobile ? formatShortCurrency(item.remaining) : formatCurrency(item.remaining)}`}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: barColor }}>{item.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {showModal && (
        <BudgetModal onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave} existing={editItem} month={month} year={year} />
      )}
    </div>
  );
}
