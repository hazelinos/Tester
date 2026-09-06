import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { toDateInputValue, formatCurrency } from '../utils/formatters';
import clsx from 'clsx';

export default function TransactionModal({ editTx, onClose, navigateToDebt }) {
  const { addTransaction, updateTransaction, deleteTransaction, updateAccount, accounts } = useFinance();

  const [type, setType] = useState(editTx?.type || 'expense');
  const [amount, setAmount] = useState(editTx?.amount ? String(editTx.amount) : '');
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || '');
  const [accountId, setAccountId] = useState(editTx?.accountId || accounts[0]?.id || '');
  const [note, setNote] = useState(editTx?.note || '');
  const [date, setDate] = useState(editTx?.date ? toDateInputValue(editTx.date) : toDateInputValue(new Date()));
  const [expenseType, setExpenseType] = useState(editTx?.expenseType || 'need');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const isEdit = !!editTx;
  const isSalarySetup = !isEdit && type === 'income' && categoryId === 'salary';

  useEffect(() => {
    if (!isEdit) {
      const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setCategoryId(cats[0].id);
      if (type === 'income') setExpenseType('need');
    }
    setCategoryPickerOpen(false);
    setCategorySearch('');
  }, [type, isEdit]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = categories.find((cat) => cat.id === categoryId) || categories[0];
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((cat) => cat.label.toLowerCase().includes(query));
  }, [categories, categorySearch]);
  const selectedAcc = accounts.find((a) => a.id === accountId);
  const numAmount = parseFloat(amount) || 0;
  const accentColor = type === 'income' ? '#A8E6CF' : '#FF6B6B';

  const balanceError = useMemo(() => {
    if (type !== 'expense' || !numAmount || !selectedAcc) return null;
    const oldAmount = (isEdit && editTx?.type === 'expense' && editTx?.accountId === accountId) ? editTx.amount : 0;
    const effectiveBalance = selectedAcc.balance + oldAmount;
    if (numAmount > effectiveBalance) return selectedAcc;
    return null;
  }, [type, numAmount, selectedAcc, isEdit, editTx, accountId]);

  const isValid = numAmount > 0 && categoryId && accountId && date && !balanceError && (type === 'income' || expenseType);

  const handleSave = () => {
    if (!isValid) return;
    if (isSalarySetup) {
      if (!selectedAcc) return;
      const salaryDate = new Date(`${date}T12:00:00`).getDate();
      updateAccount({ ...selectedAcc, salaryEnabled: true, salaryAmount: numAmount, salaryDate });
      onClose();
      return;
    }

    const data = {
      type,
      amount: numAmount,
      categoryId,
      accountId,
      note: note.trim(),
      date: new Date(date).toISOString(),
      ...(type === 'expense' ? { expenseType } : {}),
    };
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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">{isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
          <div className="flex items-center gap-2">
            {isEdit && <button onClick={handleDelete} className="btn-danger px-3 py-1.5 text-sm flex items-center gap-1.5"><Trash2 size={14} /> Hapus</button>}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated transition-colors text-text-muted"><X size={18} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
            {['expense', 'income'].map((t) => (
              <button key={t} onClick={() => setType(t)} className={clsx('py-2 rounded-lg text-sm font-semibold transition-all', type === t ? t === 'income' ? 'bg-income/20 text-income' : 'bg-expense/20 text-expense' : 'text-text-muted hover:text-text-secondary')}>
                {t === 'income' ? '↓ Pemasukan' : '↑ Pengeluaran'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Jumlah</label>
            <div className={clsx('flex items-center gap-2 bg-input border rounded-xl px-4 py-3 transition-colors', balanceError ? 'border-expense/60' : 'border-border focus-within:border-primary/50')}>
              <span className="text-text-muted font-medium">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="flex-1 bg-transparent text-2xl font-bold focus:outline-none" style={{ color: accentColor }} min="0" />
            </div>
          </div>

          {balanceError && (
            <div className="bg-expense/10 border border-expense/30 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2"><AlertTriangle size={15} className="text-expense shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-expense">Saldo tidak cukup</p><p className="text-xs text-expense/80 mt-0.5">Saldo <span className="font-medium">{balanceError.name}</span> hanya <span className="font-medium">{formatCurrency(balanceError.balance)}</span>, kurang <span className="font-medium">{formatCurrency(numAmount - balanceError.balance)}</span>.</p></div></div>
              <p className="text-xs text-text-muted pl-5">Jika ini hutang atau cicilan (SpayLater, kartu kredit, dll), catat di <button onClick={() => { onClose(); navigateToDebt?.(); }} className="text-primary underline underline-offset-2 hover:text-primary-dark font-medium">Utang & Cicilan →</button></p>
            </div>
          )}

          {type === 'expense' && (
            <div>
              <label className="text-xs text-text-muted mb-2 block">Jenis Pengeluaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setExpenseType('need')} className={clsx('rounded-xl border px-4 py-3 text-left transition-all', expenseType === 'need' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-input text-text-secondary hover:bg-elevated')}>
                  <span className="block text-sm font-semibold">Kebutuhan</span>
                  <span className="block text-[11px] opacity-60 mt-0.5">Wajib / penting</span>
                </button>
                <button type="button" onClick={() => setExpenseType('want')} className={clsx('rounded-xl border px-4 py-3 text-left transition-all', expenseType === 'want' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-input text-text-secondary hover:bg-elevated')}>
                  <span className="block text-sm font-semibold">Keinginan</span>
                  <span className="block text-[11px] opacity-60 mt-0.5">Tidak wajib</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted mb-2 block">Kategori</label>
            <button type="button" onClick={() => { setCategoryPickerOpen(true); setCategorySearch(''); }} className="w-full flex items-center gap-3 bg-input border border-border rounded-xl px-3.5 py-3 text-left hover:bg-elevated transition-colors">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${selectedCategory.color}22` }}>{selectedCategory.icon}</span>
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-text-primary truncate">{selectedCategory.label}</span><span className="block text-[11px] text-text-muted mt-0.5">Pilih kategori</span></span>
              <ChevronDown size={18} className="text-text-muted shrink-0" />
            </button>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-2 block">Akun</label>
            <div className="flex gap-2 flex-wrap">
              {accounts.map((acc) => (
                <button key={acc.id} onClick={() => setAccountId(acc.id)} className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all', accountId === acc.id ? 'border-current' : 'border-border bg-input hover:bg-elevated text-text-secondary')} style={accountId === acc.id ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color } : {}}>
                  <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: acc.iconType === 'photo' ? '#2A2A2A' : acc.color + '33' }}>{acc.iconType === 'photo' && acc.iconPhoto ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" /> : <span className="text-sm">{acc.icon}</span>}</div>
                  <span className="font-medium">{acc.name}</span>
                  <span className="text-xs opacity-60">{formatCurrency(acc.balance)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambah catatan..." maxLength={100} className="input" />
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">{isSalarySetup ? 'Tanggal Gajian' : 'Tanggal'}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input [color-scheme:dark]" />
            {isSalarySetup && <p className="text-xs text-text-muted mt-1.5">Gaji akan dicatat otomatis setiap bulan pada tanggal ini.</p>}
          </div>

          <button onClick={handleSave} disabled={!isValid} className="btn-primary w-full py-3 text-sm" style={isValid ? { backgroundColor: accentColor } : {}}>{isSalarySetup ? 'Simpan Jadwal Gaji' : isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}</button>
        </div>
      </div>

      {categoryPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setCategoryPickerOpen(false)}>
          <div className="w-full sm:max-w-md bg-[#2b2b2b] border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><span className="w-16 h-1.5 rounded-full bg-white/20" /></div>
            <div className="px-5 pt-4 pb-4"><h3 className="text-xl font-bold text-white text-center">Kategori</h3></div>
            <div className="px-5 pb-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[.02] px-4 py-3">
                <Search size={22} className="text-white/70 shrink-0" />
                <input autoFocus value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Cari kategori..." className="w-full bg-transparent text-lg text-white placeholder:text-white/50 focus:outline-none" />
              </div>
            </div>
            <div className="max-h-[58vh] overflow-y-auto border-t border-white/10">
              {filteredCategories.length ? filteredCategories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => { setCategoryId(cat.id); setCategoryPickerOpen(false); setCategorySearch(''); }} className="w-full flex items-center gap-5 px-6 py-4 border-b border-white/10 text-left hover:bg-white/[.04] transition-colors">
                  <span className="w-12 h-12 flex items-center justify-center text-3xl shrink-0">{cat.icon}</span>
                  <span className="text-[17px] text-white/90 font-medium">{cat.label}</span>
                </button>
              )) : <p className="py-12 text-center text-sm text-white/40">Kategori tidak ditemukan</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
