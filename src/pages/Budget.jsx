import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, getCategoryById } from '../constants/categories';
import MonthSelector from '../components/MonthSelector';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import clsx from 'clsx';

// ─── Budget Modal ────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">
            {existing ? 'Edit Budget' : 'Tambah Budget'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-5">
          {/* Category */}
          <div>
            <p className="text-xs text-text-muted mb-2">Kategori</p>
            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs transition-all',
                    categoryId === cat.id ? 'border-current' : 'border-border bg-input hover:bg-elevated'
                  )}
                  style={categoryId === cat.id ? { borderColor: cat.color, backgroundColor: cat.color + '22', color: cat.color } : {}}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className={clsx('text-center leading-tight', categoryId !== cat.id && 'text-text-secondary')}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs text-text-muted mb-1.5">Jumlah Budget</p>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none"
              />
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Budget</button>
        </div>
      </div>
    </div>
  );
}

// ─── Budget Item ─────────────────────────────────────────────────
function BudgetItem({ item, onEdit, onDelete }) {
  const isOver    = item.spent > item.amount;
  const isWarning = !isOver && item.percentage >= 80;
  const barColor  = isOver ? '#FF6B6B' : isWarning ? '#FFD3A5' : '#A8E6CF';

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: item.color + '22' }}>
          {item.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">{item.label}</p>
          <p className="text-xs text-text-muted">{formatCurrency(item.spent)} / {formatCurrency(item.amount)}</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense/60 hover:text-expense transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${item.percentage}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className={clsx('text-xs', isOver ? 'text-expense' : 'text-text-muted')}>
          {isOver
            ? `⚠️ Melebihi ${formatCurrency(item.spent - item.amount)}`
            : isWarning
              ? `⚡ Sisa ${formatCurrency(item.remaining)}`
              : `Sisa ${formatCurrency(item.remaining)}`}
        </span>
        <span className="text-xs font-bold" style={{ color: barColor }}>
          {item.percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function Budget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const { getBudgetUsage, setBudget, deleteBudget } = useFinance();

  const month = selectedDate.getMonth() + 1;
  const year  = selectedDate.getFullYear();

  const budgetUsage = useMemo(() => getBudgetUsage(selectedDate), [getBudgetUsage, selectedDate]);

  const itemsWithCat = budgetUsage.map((b) => {
    const cat = getCategoryById(b.categoryId);
    return { ...b, label: cat.label, icon: cat.icon, color: cat.color };
  });

  const totalBudget = itemsWithCat.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = itemsWithCat.reduce((s, b) => s + b.spent, 0);
  const overCount   = itemsWithCat.filter((b) => b.spent > b.amount).length;

  const handleSave = (data) => setBudget({ ...data, month, year });

  const handleDelete = (id) => {
    if (window.confirm('Hapus budget ini?')) deleteBudget(id);
  };

  const handleEdit = (item) => { setEditItem(item); setShowModal(true); };

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Budget</h1>
        <div className="flex items-center gap-3">
          <MonthSelector date={selectedDate} onChange={setSelectedDate} />
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={15} /> Tambah
          </button>
        </div>
      </div>

      {/* Summary */}
      {itemsWithCat.length > 0 && (
        <div className="card">
          <div className="grid grid-cols-3 gap-4 mb-3">
            {[
              { label: 'Total Budget', val: totalBudget,              color: 'text-text-primary' },
              { label: 'Terpakai',     val: totalSpent,               color: 'text-expense'      },
              { label: 'Sisa',         val: totalBudget - totalSpent, color: 'text-income'       },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-text-muted mb-1">{s.label}</p>
                <p className={clsx('text-sm font-bold', s.color)}>{formatCurrency(s.val)}</p>
              </div>
            ))}
          </div>
          {overCount > 0 && (
            <div className="flex items-center gap-2 bg-expense/10 rounded-lg px-3 py-2 mt-2">
              <AlertTriangle size={14} className="text-expense shrink-0" />
              <p className="text-xs text-expense">{overCount} kategori melebihi budget</p>
            </div>
          )}
        </div>
      )}

      {/* Budget list */}
      {itemsWithCat.length === 0 ? (
        <EmptyState icon="🎯" title="Belum ada budget" subtitle="Klik Tambah untuk membuat budget per kategori" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {itemsWithCat.map((item) => (
            <BudgetItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <BudgetModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          existing={editItem}
          month={month}
          year={year}
        />
      )}
    </div>
  );
}
