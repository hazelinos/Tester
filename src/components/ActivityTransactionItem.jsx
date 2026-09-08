import { useRef, useState } from 'react';
import { getCategoryById } from '../constants/categories';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ActivityTransactionItem({ transaction, onEdit, onOpenDetail, onDelete }) {
  const cat = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const { deleteTransaction } = useFinance();
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);
  const startOffset = useRef(0);
  const swiping = useRef(false);
  const time = transaction.date ? new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

  const reset = () => {
    setOffset(0);
    startX.current = null;
    swiping.current = false;
  };

  const onPointerDown = e => {
    startX.current = e.clientX;
    startOffset.current = offset;
    swiping.current = false;
  };

  const onPointerMove = e => {
    if (startX.current == null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 8) swiping.current = true;
    setOffset(Math.max(-160, Math.min(160, startOffset.current + delta)));
  };

  const onPointerUp = () => {
    if (startX.current == null) return;
    if (offset <= -70) setOffset(-160);
    else if (offset >= 70) setOffset(160);
    else reset();
    startX.current = null;
  };

  const handleClick = () => {
    if (swiping.current) {
      swiping.current = false;
      return;
    }
    if (offset !== 0) {
      reset();
      return;
    }
    onOpenDetail?.(transaction);
  };

  const handleDelete = () => {
    reset();
    if (onDelete) {
      onDelete(transaction);
      return;
    }
    if (window.confirm('Hapus transaksi ini?')) deleteTransaction(transaction.id);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ touchAction: 'pan-y' }}>
      <button
        onClick={handleDelete}
        className="absolute inset-y-0 left-0 w-20 bg-expense/15 text-expense text-[11px] font-bold flex flex-col items-center justify-center gap-1"
      >
        <span>×</span>Hapus
      </button>
      <button
        onClick={() => { reset(); onEdit?.(transaction); }}
        className="absolute inset-y-0 right-0 w-20 bg-primary/15 text-primary text-[11px] font-bold flex flex-col items-center justify-center gap-1"
      >
        <span>✎</span>Edit
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onClick={handleClick}
        style={{ transform: `translateX(${offset}px)` }}
        className="relative flex items-center gap-2.5 p-2.5 rounded-2xl border border-border bg-card hover:bg-elevated transition-transform duration-150 cursor-pointer select-none"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${cat.color}22` }}>{cat.icon}</div>
        <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-text-primary truncate">{transaction.note || cat.label}</p><p className="text-[10px] text-text-muted mt-0.5 truncate">{formatDate(transaction.date, 'short')}{time ? ` · ${time}` : ''}</p></div>
        <span className="text-[13px] font-bold shrink-0" style={{ color: isIncome ? '#A8E6CF' : '#FF6B6B' }}>{isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}</span>
      </div>
    </div>
  );
}
