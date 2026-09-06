import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionItem({ transaction, onEdit }) {
  const cat = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';
  const transactionDate = new Date(transaction.date);
  const timeLabel = Number.isNaN(transactionDate.getTime())
    ? ''
    : transactionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      onClick={() => onEdit?.(transaction)}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-elevated transition-colors cursor-pointer group"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: cat.color + '22' }}
      >
        {cat.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {transaction.note || cat.label}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {cat.label} · {formatDate(transaction.date, 'short')}{timeLabel && ` · ${timeLabel}`}
        </p>
      </div>

      <span
        className="text-sm font-bold shrink-0"
        style={{ color: isIncome ? '#A8E6CF' : '#FF6B6B' }}
      >
        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}
