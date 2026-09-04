import { getCategoryById } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionItem({ transaction, onEdit }) {
  const cat = getCategoryById(transaction.categoryId);
  const isIncome = transaction.type === 'income';

  return (
    <div
      onClick={() => onEdit?.(transaction)}
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-elevated transition-colors cursor-pointer group"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: cat.color + '22' }}
      >
        {cat.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {transaction.note || cat.label}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {cat.label} · {formatDate(transaction.date, 'short')}
        </p>
      </div>

      {/* Amount */}
      <span
        className="text-sm font-bold shrink-0"
        style={{ color: isIncome ? '#A8E6CF' : '#FF6B6B' }}
      >
        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}
