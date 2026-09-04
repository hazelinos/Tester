import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '../utils/formatters';

export default function MonthSelector({ date, onChange }) {
  const change = (dir) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + dir);
    onChange(d);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => change(-1)}
        className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold text-text-primary min-w-36 text-center">
        {getMonthName(date.getMonth())} {date.getFullYear()}
      </span>
      <button
        onClick={() => change(1)}
        className="p-1.5 rounded-lg hover:bg-elevated transition-colors text-text-muted hover:text-text-secondary"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
