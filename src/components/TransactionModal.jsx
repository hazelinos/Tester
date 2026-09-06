import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Search, CalendarDays, WalletCards, Delete } from 'lucide-react';
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
  let current = Number(tokens[0]);
  if (!Number.isFinite(current)) return null;
  const values = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i]; const next = Number(tokens[i + 1]);
    if (!Number.isFinite(next)) return null;
    if (op === '*') current *= next;
    else if (op === '/') { if (next === 0) return null; current /= next; }
    else { values.push(current, op); current = next; }
  }
  values.push(current);
  let result = Number(values[0]);
  for (let i = 1; i < values.length; i += 2) result = values[i] === '+' ? result + Number(values[i + 1]) : result - Number(values[i + 1]);
  return Number.isFinite(result) ? Math.round((result + Number.EPSILON) * 100) / 100 : null;
};
const getTimeLabel = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '00:00';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function TransactionModal({ editTx, onClose, navigateToDebt }) {
  const { addTransaction, updateTransaction, deleteTransaction, updateAccount, accounts, transactions } = useFinance();
  const [type, setType] = useState(editTx?.type || 'expense');
  const [expression, setExpression] = useState(editTx?.amount ? String(editTx.amount) : '');
  const [categoryId, setCategoryId] = useState(editTx?.categoryId || '');
  const [accountId, setAccountId] = useState(editTx?.accountId || accounts[0]?.id || '');
  const [note, setNote] = useState(editTx?.note || '');
  const [date, setDate] = useState(editTx?.date ? toDateInputValue(editTx.date) : toDateInputValue(new Date()));
  const [expenseType, setExpenseType] = useState(editTx?.expenseType || 'need');
  const [justCalculated, setJustCalculated] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryRows, setCategoryRows] = useState(1);

  const isEdit = !!editTx;
  const isSalarySetup = !isEdit && type === 'income' && categoryId === 'salary';
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedAcc = accounts.find((a) => a.id === accountId);
  const calculatedAmount = calculateExpression(expression);
  const numAmount = calculatedAmount !== null ? calculatedAmount : (Number(expression) || 0);
  const accentColor = type === 'income' ? '#A8E6CF' : '#FF6B6B';
  const categoryUsage = useMemo(() => { const counts = {}; transactions.forEach((tx) => { if (tx.type === type && tx.categoryId) counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1; }); return counts; }, [transactions, type]);
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => { const diff = (categoryUsage[b.id] || 0) - (categoryUsage[a.id] || 0); return diff || categories.indexOf(a) - categories.indexOf(b); }), [categories, categoryUsage]);
  const filteredCategories = useMemo(() => { const query = categorySearch.trim().toLowerCase(); return query ? sortedCategories.filter((cat) => cat.label.toLowerCase().includes(query)) : sortedCategories; }, [sortedCategories, categorySearch]);
  const categoryColumns = useMemo(() => { const columns = []; for (let i = 0; i < filteredCategories.length; i += categoryRows) columns.push(filteredCategories.slice(i, i + categoryRows)); return columns; }, [filteredCategories, categoryRows]);
  const balanceError = useMemo(() => { if (type !== 'expense' || !numAmount || !selectedAcc) return null; const oldAmount = isEdit && editTx?.type === 'expense' && editTx?.accountId === accountId ? editTx.amount : 0; const effectiveBalance = selectedAcc.balance + oldAmount; return numAmount > effectiveBalance ? selectedAcc : null; }, [type, numAmount, selectedAcc, isEdit, editTx, accountId]);
  const isValid = numAmount > 0 && !/[+\-*/]$/.test(expression) && categoryId && accountId && date && !balanceError && (type === 'income' || expenseType);

  useEffect(() => {
    if (!isEdit) {
      const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const counts = {}; transactions.forEach((tx) => { if (tx.type === type && tx.categoryId) counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1; });
      const mostUsed = [...cats].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || cats.indexOf(a) - cats.indexOf(b))[0];
      setCategoryId(mostUsed?.id || cats[0]?.id || ''); if (type === 'income') setExpenseType('need');
    }
    setCategorySearch(''); setJustCalculated(false);
  }, [type, isEdit, transactions]);

  const appendDigit = (digit) => { setExpression((current) => { if (!current || justCalculated) return digit === '000' ? '0' : digit; const last = current.split(/[+\-*/]/).pop() || ''; if (digit === '000' && last === '0') return current; return current === '0' ? digit : current + digit; }); setJustCalculated(false); };
  const appendDecimal = () => { setExpression((current) => { const base = justCalculated ? '' : current; const last = base.split(/[+\-*/]/).pop() || ''; if (last.includes('.')) return base; return base ? base + '.' : '0.'; }); setJustCalculated(false); };
  const appendOperator = (operator) => { setExpression((current) => { if (!current) return ''; if (/[+\-*/]$/.test(current)) return current.slice(0, -1) + operator; return current + operator; }); setJustCalculated(false); };
  const handleEquals = () => { const result = calculateExpression(expression); if (result === null) return; setExpression(String(result)); setJustCalculated(true); };
  const handleBackspace = () => { setExpression((current) => current.slice(0, -1)); setJustCalculated(false); };
  const handleClear = () => { setExpression(''); setJustCalculated(false); };

  const handleSave = () => {
    if (!isValid) return;
    if (isSalarySetup) { if (!selectedAcc) return; const salaryDate = new Date(`${date}T12:00:00`).getDate(); updateAccount({ ...selectedAcc, salaryEnabled: true, salaryAmount: numAmount, salaryDate }); onClose(); return; }
    const now = new Date();
    const saveTime = isEdit && editTx?.date ? getTimeLabel(editTx.date) : getTimeLabel(now);
    const data = { type, amount: numAmount, categoryId, accountId, note: note.trim(), date: new Date(`${date}T${saveTime}:00`).toISOString(), ...(type === 'expense' ? { expenseType } : {}) };
    if (isEdit) updateTransaction({ ...editTx, ...data }); else addTransaction(data); onClose();
  };
  const handleDelete = () => { if (window.confirm('Hapus transaksi ini?')) { deleteTransaction(editTx.id); onClose(); } };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-3 modal-overlay">
      <div className="modal-sheet bg-card border border-border rounded-t-[24px] sm:rounded-2xl w-full max-w-md h-[100dvh] sm:h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-center pt-2 sm:hidden shrink-0"><span className="w-12 h-1 rounded-full bg-white/15" /></div>
        <div className="flex items-center justify-between px-4 pt-2 pb-1.5 sm:p-4 sm:border-b sm:border-border shrink-0"><div><h2 className="font-bold text-lg text-text-primary">Transaksi</h2><p className="text-[10px] text-text-muted">{isEdit ? 'Edit transaksi' : 'Tambah transaksi'}</p></div><div className="flex items-center gap-1">{isEdit && <button onClick={handleDelete} className="btn-danger px-2.5 py-1 text-xs flex items-center gap-1"><Trash2 size={13} /> Hapus</button>}<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-text-muted"><X size={17} /></button></div></div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-1.5 pb-4"><div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5"><button type="button" onClick={() => setType('expense')} className={clsx('py-2 border-b-2 text-sm font-bold', type === 'expense' ? 'text-expense border-expense' : 'text-text-muted border-transparent')}>PENGELUARAN</button><button type="button" onClick={() => setType('income')} className={clsx('py-2 border-b-2 text-sm font-bold', type === 'income' ? 'text-income border-income' : 'text-text-muted border-transparent')}>PEMASUKAN</button></div>
          <div className="grid grid-cols-2 gap-2 max-w-[320px] w-full mx-auto">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-input px-2.5 py-2 cursor-pointer min-w-0"><CalendarDays size={20} className="text-text-secondary shrink-0" /><div className="flex items-center min-w-0 flex-1"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full min-w-0 bg-transparent text-xs text-text-primary focus:outline-none [color-scheme:dark] appearance-none" /></div></label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-input px-2.5 py-2 min-w-0"><WalletCards size={20} className="text-text-secondary shrink-0" /><select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-text-primary focus:outline-none"><option value="" disabled>Pilih akun</option>{accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select></div>
          </div>
          <div className="text-center py-0.5"><p className="text-[10px] text-text-muted mb-0.5">Jumlah</p><div className="flex items-center justify-center gap-1.5 min-h-[52px]"><span className="text-base font-semibold" style={{color:accentColor}}>Rp</span><span className="text-[36px] leading-none font-bold tracking-tight tabular-nums" style={{color:accentColor}}>{formatExpression(expression)||'0'}</span></div>{balanceError&&<p className="text-[10px] text-expense mt-1.5">Saldo {balanceError.name} tidak cukup · kurang {formatCurrency(numAmount-balanceError.balance)}</p>}</div>
          <div className="flex items-center justify-between text-right px-1"><span className="text-[10px] text-text-muted">{expression&&/[+\-*/]/.test(expression)?'Hasil perhitungan':''}</span><span className="text-sm font-semibold text-text-secondary">= {formatAmount(numAmount)}</span></div>
          <div><div className="flex items-center justify-between gap-2 mb-1.5"><p className="text-xs font-bold tracking-widest text-text-muted">KATEGORI</p><div className="flex items-center gap-1">{[1,2,3].map((rows)=><button key={rows} type="button" onClick={()=>setCategoryRows(rows)} className={clsx('min-w-6 h-6 px-1.5 rounded-md text-[10px] font-bold border',categoryRows===rows?'bg-primary/15 text-primary border-primary/30':'bg-input text-text-muted border-border')}>{rows}</button>)}</div></div><div className="relative mb-1.5"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"/><input value={categorySearch} onChange={(e)=>setCategorySearch(e.target.value)} placeholder="Cari kategori..." className="w-full h-8 bg-input border border-border rounded-lg pl-8 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"/></div><div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">{categoryColumns.map((column,index)=><div key={index} className="grid gap-1.5 shrink-0" style={{gridTemplateRows:`repeat(${categoryRows}, minmax(0,1fr))`}}>{column.map((cat)=><button key={cat.id} type="button" onClick={()=>setCategoryId(cat.id)} className={clsx('w-[64px] h-[56px] rounded-lg border bg-input flex flex-col items-center justify-center gap-0.5 px-0.5',categoryId===cat.id?'border-current bg-white/[.06]':'border-border')} style={categoryId===cat.id?{color:cat.color}:{}}><span className="text-[20px] leading-none">{cat.icon}</span><span className={clsx('text-[9px] leading-tight text-center line-clamp-2',categoryId===cat.id?'':'text-text-secondary')}>{cat.label}</span></button>)}</div>)}</div>{!filteredCategories.length&&<p className="text-[10px] text-text-muted text-center py-2">Kategori tidak ditemukan.</p>}</div>
          {type==='expense'&&<div><p className="text-xs font-bold tracking-widest text-text-muted mb-1.5">TIPE</p><div className="grid grid-cols-2 gap-1.5"><button type="button" onClick={()=>setExpenseType('need')} className={clsx('rounded-xl border px-3 py-2 text-center',expenseType==='need'?'border-primary bg-primary/10 text-primary':'border-border bg-input text-text-secondary')}><span className="text-xs font-semibold">Kebutuhan</span></button><button type="button" onClick={()=>setExpenseType('want')} className={clsx('rounded-xl border px-3 py-2 text-center',expenseType==='want'?'border-primary bg-primary/10 text-primary':'border-border bg-input text-text-secondary')}><span className="text-xs font-semibold">Keinginan</span></button></div></div>}
          <div><input type="text" value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Deskripsi (Opsional)" maxLength={100} className="w-full bg-input border border-border rounded-xl px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"/></div>
        </div></div>
        <div className="shrink-0 border-t border-border bg-card px-4 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]"><div className="grid grid-cols-4 gap-1.5 select-none">
          <button type="button" onClick={()=>appendDigit('1')} className="keypad-key">1</button><button type="button" onClick={()=>appendDigit('2')} className="keypad-key">2</button><button type="button" onClick={()=>appendDigit('3')} className="keypad-key">3</button><button type="button" onClick={handleBackspace} className="keypad-key keypad-danger"><Delete size={18}/></button>
          <button type="button" onClick={()=>appendDigit('4')} className="keypad-key">4</button><button type="button" onClick={()=>appendDigit('5')} className="keypad-key">5</button><button type="button" onClick={()=>appendDigit('6')} className="keypad-key">6</button><button type="button" onClick={()=>appendOperator('+')} className="keypad-key keypad-purple">+</button>
          <button type="button" onClick={()=>appendDigit('7')} className="keypad-key">7</button><button type="button" onClick={()=>appendDigit('8')} className="keypad-key">8</button><button type="button" onClick={()=>appendDigit('9')} className="keypad-key">9</button><button type="button" onClick={()=>appendOperator('-')} className="keypad-key keypad-purple">−</button>
          <button type="button" onClick={()=>appendDecimal()} className="keypad-key keypad-blue">.</button><button type="button" onClick={()=>appendDigit('0')} className="keypad-key">0</button><button type="button" onClick={()=>appendDigit('000')} className="keypad-key">000</button><button type="button" onClick={()=>appendOperator('*')} className="keypad-key keypad-purple">×</button>
          <button type="button" onClick={handleClear} className="keypad-key keypad-danger col-span-2">C</button><button type="button" onClick={()=>appendOperator('/')} className="keypad-key keypad-purple">÷</button><button type="button" disabled={!isValid} onClick={handleSave} className="keypad-key keypad-save" aria-label={isEdit?'Simpan perubahan':'Simpan transaksi'}>✓</button>
          <button type="button" onClick={handleEquals} className="keypad-key keypad-blue col-span-4">=</button>
        </div></div>
      </div>
    </div>
  );
}
