import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { toDateInputValue, formatCurrency } from '../utils/formatters';
import clsx from 'clsx';

export default function TransactionModal({ editTx, onClose, navigateToDebt }) {
  const { addTransaction, updateTransaction, deleteTransaction, accounts } = useFinance();

  const [type,       setType]       = useState(editTx?.type       || 'expense');
  const [amount,     setAmount]     = useState(editTx?.amount      ? String(editTx.amount) : '');
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || '');
  const [accountId,  setAccountId]  = useState(editTx?.accountId  || accounts[0]?.id || '');
  const [note,       setNote]       = useState(editTx?.note        || '');
  const [date,       setDate]       = useState(editTx?.date        ? toDateInputValue(editTx.date) : toDateInputValue(new Date()));

  const isEdit = !!editTx;

  useEffect(() => {
    if (!isEdit) {
      const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setCategoryId(cats[0].id);
    }
  }, [type]);

  const categories  = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedAcc = accounts.find((a) => a.id === accountId);
  const numAmount   = parseFloat(amount) || 0;
  const accentColor = type === 'income' ? '#A8E6CF' : '#FF6B6B';

  // ── Validasi saldo ──────────────────────────────────────────
  const balanceError = useMemo(() => {
    if (type !== 'expense' || !numAmount || !selectedAcc) return null;
    const oldAmount = (isEdit && editTx?.type === 'expense' && editTx?.accountId === accountId)
      ? editTx.amount : 0;
    const effectiveBalance = selectedAcc.balance + oldAmount;
    if (numAmount > effectiveBalance) return selectedAcc;
    return null;
  }, [type, numAmount, selectedAcc, isEdit, editTx, accountId]);

  const isValid = numAmount > 0 && categoryId && accountId && date && !balanceError;

  const handleSave = () => {
    if (!isValid) return;
    const data = { type, amount: numAmount, categoryId, accountId, note: note.trim(), date: new Date(date).toISOString() };
    if (isEdit) updateTransaction({ ...editTx, ...data });
    else addTransaction(data);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Hapus transaksi ini?')) {
      deleteTransaction(editTx.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <div className="flex items-center gap-2">
            {isEdit && (
              <button onClick={handleDelete} className="btn-danger px-3 py-1.5 text-sm flex items-center gap-1.5">
                <Trash2 size={14} /> Hapus
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated transition-colors text-text-muted">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
            {['expense', 'income'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'py-2 rounded-lg text-sm font-semibold transition-all',
                  type === t
                    ? t === 'income' ? 'bg-income/20 text-income' : 'bg-expense/20 text-expense'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {t === 'income' ? '↓ Pemasukan' : '↑ Pengeluaran'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Jumlah</label>
            <div className={clsx(
              'flex items-center gap-2 bg-input border rounded-xl px-4 py-3 transition-colors',
              balanceError ? 'border-expense/60' : 'border-border focus-within:border-primary/50'
            )}>
              <span className="text-text-muted font-medium">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-2xl font-bold focus:outline-none"
                style={{ color: accentColor }}
                min="0"
              />
            </div>
          </div>

          {/* ── Error saldo tidak cukup ───────────── */}
          {balanceError && (
            <div className="bg-expense/10 border border-expense/30 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-expense shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-expense">Saldo tidak cukup</p>
                  <p className="text-xs text-expense/80 mt-0.5">
                    Saldo <span className="font-medium">{balanceError.name}</span> hanya{' '}
                    <span className="font-medium">{formatCurrency(balanceError.balance)}</span>,
                    kurang <span className="font-medium">{formatCurrency(numAmount - balanceError.balance)}</span>.
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-muted pl-5">
                Jika ini hutang atau cicilan (SpayLater, kartu kredit, dll), catat di{' '}
                <button
                  onClick={() => { onClose(); navigateToDebt?.(); }}
                  className="text-primary underline underline-offset-2 hover:text-primary-dark font-medium"
                >
                  Utang & Cicilan →
                </button>
              </p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => (
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
                  <span className={clsx('text-center leading-tight', categoryId === cat.id ? '' : 'text-text-secondary')}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs text-text-muted mb-2 block">Akun</label>
            <div className="flex gap-2 flex-wrap">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                    accountId === acc.id ? 'border-current' : 'border-border bg-input hover:bg-elevated text-text-secondary'
                  )}
                  style={accountId === acc.id ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color } : {}}
                >
                  <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center shrink-0"
                    style={{ backgroundColor: acc.iconType === 'photo' ? '#2A2A2A' : acc.color + '33' }}>
                    {acc.iconType === 'photo' && acc.iconPhoto
                      ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                      : <span className="text-sm">{acc.icon}</span>}
                  </div>
                  <span className="font-medium">{acc.name}</span>
                  <span className="text-xs opacity-60">{formatCurrency(acc.balance)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Tambah catatan..." maxLength={100} className="input" />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="input [color-scheme:dark]" />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="btn-primary w-full py-3 text-sm"
            style={isValid ? { backgroundColor: accentColor } : {}}
          >
            {isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}
