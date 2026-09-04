import { useEffect, useMemo, useState } from 'react';
import { Bell, X, CalendarClock, PiggyBank, CreditCard, Receipt } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

const STORAGE_KEY = 'finance_reminder_settings';
const DEFAULTS = { leadDays: 3, savingsDefault: 'daily' };

const SAVING_PATTERNS = [
  { id: 'daily', label: 'Setiap hari' },
  { id: 'every2days', label: 'Setiap 2 hari' },
  { id: 'every3days', label: 'Setiap 3 hari' },
  { id: 'weekly', label: 'Seminggu sekali' },
];

const WEEKDAYS = [
  ['1', 'Senin'], ['2', 'Selasa'], ['3', 'Rabu'], ['4', 'Kamis'],
  ['5', 'Jumat'], ['6', 'Sabtu'], ['0', 'Minggu'],
];

const readSettings = () => {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return DEFAULTS;
  }
};

const saveSettings = (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

const daysUntil = (date) => {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
};

const isSavingDue = (saving, config) => {
  const pattern = saving.reminderPattern || config.savingsDefault;
  if (pattern === 'weekly') {
    const day = String(saving.reminderWeekday ?? '5');
    return String(new Date().getDay()) === day;
  }
  const created = saving.reminderStartDate ? new Date(saving.reminderStartDate) : new Date();
  created.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - created) / 86400000);
  if (diff < 0) return false;
  if (pattern === 'every2days') return diff % 2 === 0;
  if (pattern === 'every3days') return diff % 3 === 0;
  return true;
};

export default function ReminderCenter() {
  const { debts, subscriptions, savings } = useFinance();
  const [config, setConfig] = useState(readSettings);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(() => new Set());

  const reminders = useMemo(() => {
    const result = [];

    debts.filter(d => d.dueDate && (d.totalPayable || d.total) > (d.paid || 0)).forEach(d => {
      const days = daysUntil(d.dueDate);
      if (days !== null && days >= 0 && days <= Number(config.leadDays)) {
        result.push({ id: `debt:${d.id}:${d.dueDate}`, type: 'debt', title: d.name, text: days === 0 ? 'Jatuh tempo hari ini' : `Jatuh tempo ${days} hari lagi`, amount: d.installment || Math.max((d.totalPayable || d.total) - (d.paid || 0), 0) });
      }
    });

    subscriptions.filter(s => s.active !== false && s.billingDay).forEach(s => {
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), Number(s.billingDay));
      let due = thisMonth;
      if (due < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        if (s.cycle === 'quarterly') due = new Date(today.getFullYear(), today.getMonth() + 3, Number(s.billingDay));
        else if (s.cycle === 'yearly') due = new Date(today.getFullYear() + 1, today.getMonth(), Number(s.billingDay));
        else due = new Date(today.getFullYear(), today.getMonth() + 1, Number(s.billingDay));
      }
      const days = Math.ceil((due - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      if (days >= 0 && days <= Number(config.leadDays)) {
        result.push({ id: `subscription:${s.id}:${due.toISOString().slice(0, 10)}`, type: 'subscription', title: s.name, text: days === 0 ? 'Tagihan hari ini' : `Tagihan ${days} hari lagi`, amount: s.amount });
      }
    });

    savings.filter(s => s.collected < s.target && s.reminderEnabled !== false).forEach(s => {
      if (isSavingDue(s, config)) {
        result.push({ id: `saving:${s.id}:${new Date().toISOString().slice(0, 10)}`, type: 'saving', title: s.name, text: 'Waktunya setor tabungan', amount: s.installment || 0, saving: s });
      }
    });

    return result;
  }, [debts, subscriptions, savings, config]);

  useEffect(() => {
    const currentIds = new Set(reminders.map(r => r.id));
    setDismissed(prev => new Set([...prev].filter(id => currentIds.has(id))));
  }, [reminders]);

  const active = reminders.filter(r => !dismissed.has(r.id));
  if (!visible || active.length === 0) return null;

  const closeAll = () => setVisible(false);

  const updateSaving = (saving, patch) => {
    const next = { ...saving, ...patch };
    const all = [...savings];
    const idx = all.findIndex(s => s.id === saving.id);
    if (idx >= 0) {
      all[idx] = next;
      localStorage.setItem('finance_savings', JSON.stringify(all));
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-20 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[390px] z-[60]">
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <div>
              <p className="text-sm font-bold text-text-primary">Pengingat</p>
              <p className="text-[10px] text-text-muted">{active.length} hal perlu diperhatikan</p>
            </div>
          </div>
          <button onClick={closeAll} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted"><X size={15} /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
          {active.map(item => (
            <div key={item.id} className="p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-elevated flex items-center justify-center shrink-0">
                  {item.type === 'saving' ? <PiggyBank size={16} className="text-primary" /> : item.type === 'debt' ? <CreditCard size={16} className="text-expense" /> : <Receipt size={16} className="text-expense" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text-primary truncate">{item.title}</p>
                  <p className="text-[10px] text-text-muted">{item.text}</p>
                  {item.amount > 0 && <p className="text-xs font-bold text-text-primary mt-0.5">{formatCurrency(item.amount)}</p>}
                </div>
                <button onClick={() => setDismissed(prev => new Set(prev).add(item.id))} className="p-1 text-text-muted hover:text-text-primary"><X size={12} /></button>
              </div>

              {item.type === 'saving' && item.saving && (
                <div className="bg-elevated rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted"><CalendarClock size={11} /> Pola menabung</div>
                  <select
                    value={item.saving.reminderPattern || config.savingsDefault}
                    onChange={e => updateSaving(item.saving, { reminderEnabled: true, reminderPattern: e.target.value, reminderStartDate: item.saving.reminderStartDate || new Date().toISOString() })}
                    className="input text-xs [color-scheme:dark]"
                  >
                    {SAVING_PATTERNS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    <option value="weekly">Hari tertentu</option>
                  </select>
                  {(item.saving.reminderPattern || config.savingsDefault) === 'weekly' && (
                    <select
                      value={String(item.saving.reminderWeekday ?? '5')}
                      onChange={e => updateSaving(item.saving, { reminderEnabled: true, reminderPattern: 'weekly', reminderWeekday: e.target.value, reminderStartDate: item.saving.reminderStartDate || new Date().toISOString() })}
                      className="input text-xs [color-scheme:dark]"
                    >
                      {WEEKDAYS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center justify-between gap-2">
          <span className="text-[10px] text-text-muted">Hutang & tagihan: H-{config.leadDays}</span>
          <select
            value={config.leadDays}
            onChange={e => { const next = { ...config, leadDays: Number(e.target.value) }; setConfig(next); saveSettings(next); }}
            className="bg-elevated border border-border rounded-lg px-2 py-1 text-[10px] text-text-secondary [color-scheme:dark]"
          >
            {[1,2,3,5,7,14].map(n => <option key={n} value={n}>H-{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
