import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, AlertTriangle, Search, ChevronDown, CalendarDays, WalletCards, Delete } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { toDateInputValue, formatCurrency } from '../utils/formatters';
import clsx from 'clsx';

const formatAmount = (value) => {
  if (!value) return '0';
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
};

const formatExpression = (value) => value.replace(/\d+(?:\.\d+)?/g, (n) => formatAmount(n));

const calculateExpression = (expression) => {
  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/]/g) || [];
  if (!tokens.length || /[+\-*/]$/.test(expression)) return null;
  const values = [];
  let current = Number(tokens[0]);
  if (!Number.isFinite(current)) return null;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const next = Number(tokens[i + 1]);
    if (!Number.isFinite(next)) return null;
    if (op === '*') current *= next;
    else if (op === '/') {
      if (next === 0) return null;
      current /= next;
    } else {
      values.push(current, op);
      current = next;
    }
  }
  values.push(current);
  let result = Number(values[0]);
  for (let i = 1; i < values.length; i += 2) result = values[i] === '+' ? result + Number(values[i + 1]) : result - Number(values[i + 1]);
  return Number.isFinite(result) ? Math.round((result + Number.EPSILON) * 100) / 100 : null;
};

export default function TransactionModal({ editTx, onClose, navigateToDebt }) {
  const { addTransaction, updateTransaction, deleteTransaction, updateAccount, accounts } = useFinance();
  const [type, setType] = useState(editTx?.type || 'expense');
  const [expression, setExpression] = useState(editTx?.amount ? String(editTx.amount) : '');
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || '');
  const [accountId, setAccountId] = useState(editTx?.accountId || accounts[0]?.id || '');
  const [note, setNote] = useState(editTx?.note || '');
  const [date, setDate] = useState(editTx?.date ? toDateInputValue(editTx.date) : toDateInputValue(new Date()));
  const [expenseType, setExpenseType] = useState(editTx?.expenseType || 'need');
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);

  const isEdit = !!editTx;
  const isSalarySetup = !isEdit && type === 'income' && categoryId === 'salary';
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = categories.find((cat) => cat.id === categoryId) || categories[0];
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return query ? categories.filter((cat) => cat.label.toLowerCase().includes(query)) : categories;
  }, [categories, categorySearch]);
  const selectedAcc = accounts.find((a) => a.id === accountId);
  const numAmount = calculateExpression(expression) ?? Number(expression) || 0;
  const accentColor = type === 'income' ? '#A8E6CF' : '#FF6B6B';

  const balanceError = useMemo(() => {
    if (type !== 'expense' || !numAmount || !selectedAcc) return null;
    const oldAmount = isEdit && editTx?.type === 'expense' && editTx?.accountId === accountId ? editTx.amount : 0;
    const effectiveBalance = selectedAcc.balance + oldAmount;
    return numAmount > effectiveBalance ? selectedAcc : null;
  }, [type, numAmount, selectedAcc, isEdit, editTx, accountId]);

  const isValid = numAmount > 0 && categoryId && accountId && date && !balanceError && (type === 'income' || expenseType);

  useEffect(() => {
    if (!isEdit) {
      const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setCategoryId(cats[0].id);
      if (type === 'income') setExpenseType('need');
    }
    setCategoryPickerOpen(false);
    setCategorySearch('');
    setJustCalculated(false);
  }, [type, isEdit]);

  const appendDigit = (digit) => {
    setJustCalculated(false);
    setExpression((current) => {
      if (!current || justCalculated) return digit === '000' ? '0' : digit;
      const last = current.split(/[+\-*/]/).pop() || '';
      if (digit === '000' && last === '0') return current;
      return current === '0' ? digit : current + digit;
    });
  };

  const appendDecimal = () => {
    setJustCalculated(false);
    setExpression((current) => {
      const last = current.split(/[+\-*/]/).pop() || '';
      if (last.includes('.')) return current;
      return current ? current + '.' : '0.';
    });
  };

  const appendOperator = (operator) => {
    setJustCalculated(false);
    setExpression((current) => {
      if (!current) return '';
      if (/[+\-*/]$/.test(current)) return current.slice(0, -1) + operator;
      return current + operator;
    });
  };

  const handleEquals = () => {
    const result = calculateExpression(expression);
    if (result === null) return;
    setExpression(String(result));
    setJustCalculated(true);
  };

  const handleBackspace = () => {
    setJustCalculated(false);
    setExpression((current) => current.slice(0, -1));
  };

  const handleClear = () => {
    setJustCalculated(false);
    setExpression('');
  };

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 modal-overlay">
      <div className="modal-sheet bg-card border border-border rounded-t-[28px] sm:rounded-2xl w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 sm:hidden"><span className="w-16 h-1.5 rounded-full bg-white/15" /></div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2 sm:p-5 sm:border-b sm:border-border">
          <div>
            <h2 className="font-bold text-xl text-text-primary">Transaksi</h2>
            <p className="text-xs text-text-muted">{isEdit ? 'Edit transaksi' : 'Tambah transaksi'}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isEdit && <button onClick={handleDelete} className="btn-danger px-3 py-1.5 text-sm flex items-center gap-1.5"><Trash2 size={14} /> Hapus</button>}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated transition-colors text-text-muted"><X size={19} /></button>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('expense')} className={clsx('py-3 border-b-2 text-base font-bold transition-colors', type === 'expense' ? 'text-expense border-expense' : 'text-text-muted border-transparent')}>PENGELUARAN</button>
            <button type="button" onClick={() => setType('income')} className={clsx('py-3 border-b-2 text-base font-bold transition-colors', type === 'income' ? 'text-income border-income' : 'text-text-muted border-transparent')}>PEMASUKAN</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-input px-3 py-3 cursor-pointer">
              <CalendarDays size={25} className="text-text-secondary shrink-0" />
              <span className="min-w-0"><span className="block text-xs text-text-muted">Tanggal</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm text-text-primary focus:outline-none [color-scheme:dark]" /></span>
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-input px-3 py-3">
              <WalletCards size={25} className="text-text-secondary shrink-0" />
              <div className="min-w-0 flex-1"><span className="block text-xs text-text-muted">Akun</span><select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-transparent text-sm text-text-primary focus:outline-none"><option value="" disabled>Pilih akun</option>{accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
            </div>
          </div>

          <div className="text-center py-1">
            <p className="text-xs text-text-muted mb-1">Jumlah</p>
            <div className="flex items-center justify-center gap-2 min-h-[62px]">
              <span className="text-lg font-semibold" style={{ color: accentColor }}>Rp</span>
              <span className="text-[42px] leading-none font-bold tracking-tight tabular-nums" style={{ color: accentColor }}>{formatExpression(expression) || '0'}</span>
            </div>
            {balanceError && <p className="text-xs text-expense mt-2">Saldo {balanceError.name} tidak cukup · kurang {formatCurrency(numAmount - balanceError.balance)}</p>}
          </div>

          <div>
            <div className="flex items-center rounded-2xl border border-border bg-input overflow-hidden">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Deskripsi (Opsional)" maxLength={100} className="flex-1 bg-transparent px-4 py-4 text-base text-text-primary placeholder:text-text-muted focus:outline-none" />
              <span className="px-4 text-xl opacity-70">✨</span>
            </div>
            <p className="text-[11px] text-text-muted mt-2">✣ Otomatis kategorikan dari transaksi terakhir</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold tracking-widest text-text-muted">KATEGORI</p>
              <button type="button" onClick={() => { setCategoryPickerOpen(true); setCategorySearch(''); }} className="flex items-center gap-1 text-xs text-text-muted">{categories.length} kategori <ChevronDown size={14} /></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
              <button type="button" onClick={() => { setCategoryPickerOpen(true); setCategorySearch(''); }} className="shrink-0 w-[84px] h-[84px] rounded-2xl border border-border bg-input flex flex-col items-center justify-center gap-1.5 text-text-muted">
                <Search size={28} /><span className="text-xs">Cari</span>
              </button>
              {categories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)} className={clsx('shrink-0 w-[84px] h-[84px] rounded-2xl border bg-input flex flex-col items-center justify-center gap-1 px-1 transition-all snap-start', categoryId === cat.id ? 'border-current bg-white/[.06]' : 'border-border')} style={categoryId === cat.id ? { color: cat.color } : {}}>
                  <span className="text-[30px] leading-none">{cat.icon}</span>
                  <span className={clsx('text-[11px] leading-tight text-center line-clamp-2', categoryId === cat.id ? '' : 'text-text-secondary')}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {type === 'expense' && (
            <div>
              <p className="text-sm font-bold tracking-widest text-text-muted mb-2">TIPE</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setExpenseType('need')} className={clsx('rounded-2xl border px-4 py-3 text-center transition-all', expenseType === 'need' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-input text-text-secondary')}>
                  <span className="block text-xl mb-1">🧺</span><span className="text-sm font-semibold">Kebutuhan</span>
                </button>
                <button type="button" onClick={() => setExpenseType('want')} className={clsx('rounded-2xl border px-4 py-3 text-center transition-all', expenseType === 'want' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-input text-text-secondary')}>
                  <span className="block text-xl mb-1">👑</span><span className="text-sm font-semibold">Keinginan</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-right px-1">
            <span className="text-xs text-text-muted">{expression && /[+\-*/]/.test(expression) ? 'Hasil perhitungan' : ''}</span>
            <span className="text-base font-semibold text-text-secondary">= {formatAmount(numAmount)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pb-2 select-none">
            <button type="button" onClick={() => appendDigit('1')} className="keypad-key">1</button>
            <button type="button" onClick={() => appendDigit('2')} className="keypad-key">2</button>
            <button type="button" onClick={() => appendDigit('3')} className="keypad-key">3</button>
            <button type="button" onClick={handleBackspace} className="keypad-key keypad-danger"><Delete size={26} /></button>
            <button type="button" onClick={() => appendDigit('4')} className="keypad-key">4</button>
            <button type="button" onClick={() => appendDigit('5')} className="keypad-key">5</button>
            <button type="button" onClick={() => appendDigit('6')} className="keypad-key">6</button>
            <button type="button" onClick={() => appendOperator('+')} className="keypad-key keypad-purple">+</button>
            <button type="button" onClick={() => appendDigit('7')} className="keypad-key">7</button>
            <button type="button" onClick={() => appendDigit('8')} className="keypad-key">8</button>
            <button type="button" onClick={() => appendDigit('9')} className="keypad-key">9</button>
            <button type="button" onClick={() => appendOperator('-')} className="keypad-key keypad-purple">−</button>
            <button type="button" onClick={appendDecimal} className="keypad-key">.</button>
            <button type="button" onClick={() => appendDigit('0')} className="keypad-key">0</button>
            <button type="button" onClick={() => appendDigit('000')} className="keypad-key">000</button>
            <button type="button" onClick={() => appendOperator('*')} className="keypad-key keypad-purple">×</button>
            <button type="button" onClick={handleClear} className="keypad-key text-sm">C</button>
            <button type="button" onClick={() => appendOperator('/')} className="keypad-key keypad-purple">÷</button>
            <button type="button" onClick={handleEquals} className="keypad-key keypad-blue">=</button>
            <button type="button" onClick={handleSave} disabled={!isValid} className="keypad-key keypad-save col-span-1" aria-label="Simpan transaksi">✓</button>
          </div>

          {isSalarySetup && <p className="text-xs text-text-muted text-center pb-1">Gaji akan dicatat otomatis setiap bulan pada tanggal ini.</p>}
        </div>
      </div>

      {categoryPickerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center" onClick={() => setCategoryPickerOpen(false)}>
          <div className="w-full sm:max-w-md bg-[#2b2b2b] border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><span className="w-16 h-1.5 rounded-full bg-white/20" /></div>
            <div className="px-5 pt-4 pb-4"><h3 className="text-xl font-bold text-white text-center">Kategori</h3></div>
            <div className="px-5 pb-4"><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[.02] px-4 py-3"><Search size={22} className="text-white/70 shrink-0" /><input autoFocus value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Cari kategori..." className="w-full bg-transparent text-lg text-white placeholder:text-white/50 focus:outline-none" /></div></div>
            <div className="max-h-[58vh] overflow-y-auto border-t border-white/10">
              {filteredCategories.length ? filteredCategories.map((cat) => <button key={cat.id} type="button" onClick={() => { setCategoryId(cat.id); setCategoryPickerOpen(false); setCategorySearch(''); }} className="w-full flex items-center gap-5 px-6 py-4 border-b border-white/10 text-left hover:bg-white/[.04]"><span className="w-12 h-12 flex items-center justify-center text-3xl shrink-0">{cat.icon}</span><span className="text-[17px] text-white/90 font-medium">{cat.label}</span></button>) : <p className="py-12 text-center text-sm text-white/40">Kategori tidak ditemukan</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
