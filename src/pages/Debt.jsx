import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Calendar, AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import clsx from 'clsx';

// ─── Debt Modal ───────────────────────────────────────────────────
function DebtModal({ onClose, onSave, existing }) {
  const [kind,        setKind]        = useState(existing?.kind        || 'debt');
  const [name,        setName]        = useState(existing?.name        || '');
  const [total,       setTotal]       = useState(existing?.total       ? String(existing.total) : '');
  const [months,      setMonths]      = useState(existing?.months      ? String(existing.months) : '');
  const [installment, setInstallment] = useState(existing?.installment ? String(existing.installment) : '');
  const [dueDate,     setDueDate]     = useState(existing?.dueDate     || '');
  const [note,        setNote]        = useState(existing?.note        || '');

  // Auto-hitung cicilan saat total atau bulan berubah
  const handleTotalChange = (val) => {
    setTotal(val);
    const t = parseFloat(val);
    const m = parseInt(months);
    if (t > 0 && m > 0) setInstallment(String(Math.ceil(t / m)));
  };

  const handleMonthsChange = (val) => {
    setMonths(val);
    const t = parseFloat(total);
    const m = parseInt(val);
    if (t > 0 && m > 0) setInstallment(String(Math.ceil(t / m)));
    else if (!val) setInstallment('');
  };

  const handleInstallmentChange = (val) => {
    setInstallment(val);
    // Kalau user edit manual, reset months supaya tidak konflik
    setMonths('');
  };

  const numTotal       = parseFloat(total) || 0;
  const numMonths      = parseInt(months) || 0;
  const numInstallment = parseFloat(installment) || 0;

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama hutang/piutang');
    if (!numTotal || numTotal <= 0) return alert('Masukkan jumlah yang valid');
    onSave({
      ...(existing || {}),
      kind,
      name:        name.trim(),
      total:       numTotal,
      months:      numMonths,
      installment: numInstallment,
      dueDate,
      note:        note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">
            {existing ? 'Edit Hutang/Piutang' : 'Tambah Hutang/Piutang'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Kind toggle */}
          <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
            {[
              { id: 'debt',       label: '💸 Hutang',  sub: 'Kamu yang berhutang'        },
              { id: 'receivable', label: '🤝 Piutang', sub: 'Orang lain berhutang ke kamu' },
            ].map((k) => (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                className={clsx(
                  'py-2.5 px-3 rounded-lg text-left transition-all',
                  kind === k.id
                    ? k.id === 'debt' ? 'bg-expense/20 text-expense' : 'bg-income/20 text-income'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <p className="text-sm font-semibold">{k.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{k.sub}</p>
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama / Keterangan</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={kind === 'debt' ? 'Contoh: SpayLater, Cicilan HP, Hutang ke Budi' : 'Contoh: Pinjaman ke Andi'}
              maxLength={50} className="input"
            />
          </div>

          {/* Total */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">
              Total {kind === 'debt' ? 'Hutang' : 'Piutang'}
            </label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input
                type="number" value={total} onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cicilan — bulan + per bulan */}
          <div className="space-y-3">
            <label className="text-xs text-text-muted block">Cicilan (opsional)</label>

            {/* Berapa bulan */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-1.5">Berapa Bulan</p>
                <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-2.5 focus-within:border-primary/50">
                  <input
                    type="number" value={months} onChange={(e) => handleMonthsChange(e.target.value)}
                    placeholder="cth: 12"
                    className="flex-1 bg-transparent text-base font-semibold text-text-primary focus:outline-none"
                    min="1"
                  />
                  <span className="text-text-muted text-xs">bulan</span>
                </div>
              </div>

              <div className="text-text-muted text-lg pt-5">=</div>

              {/* Cicilan per bulan (auto atau manual) */}
              <div className="flex-1">
                <p className="text-xs text-text-muted mb-1.5">Per Bulan</p>
                <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-2.5 focus-within:border-primary/50">
                  <span className="text-text-muted text-xs">Rp</span>
                  <input
                    type="number" value={installment} onChange={(e) => handleInstallmentChange(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-transparent text-base font-semibold text-text-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Preview cicilan */}
            {numTotal > 0 && numMonths > 0 && numInstallment > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-primary">
                  {numTotal.toLocaleString('id-ID')} ÷ {numMonths} bulan
                </span>
                <span className="text-sm font-bold text-primary">
                  = {formatCurrency(numInstallment)}/bln
                </span>
              </div>
            )}
          </div>

          {/* Jatuh tempo */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jatuh Tempo (opsional)</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="input [color-scheme:dark]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Keterangan tambahan..." rows={2} maxLength={120}
              className="input resize-none"
            />
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────
function PaymentModal({ debt, onClose, onAdd }) {
  const { accounts } = useFinance();
  const [amount,    setAmount]    = useState(debt.installment ? String(debt.installment) : '');
  const [note,      setNote]      = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const remaining = debt.total - (debt.paid || 0);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah pembayaran');
    if (!accountId && debt.kind === 'debt') return alert('Pilih akun untuk pembayaran');
    if (debt.kind === 'debt' && accountId) {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc && num > acc.balance)
        return alert(`Saldo ${acc.name} tidak cukup (${formatCurrency(acc.balance)})`);
    }
    onAdd(debt.id, num, note.trim(), debt.kind === 'debt' ? accountId : '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">
            {debt.kind === 'debt' ? 'Bayar Cicilan' : 'Tandai Dibayar'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* Info sisa */}
          <div className="bg-bg rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-text-muted mb-1">
              Sisa {debt.kind === 'debt' ? 'hutang' : 'piutang'}{' '}
              <span className="font-medium text-text-secondary">{debt.name}</span>
            </p>
            <p className="text-xl font-bold" style={{ color: debt.kind === 'debt' ? '#FF6B6B' : '#A8E6CF' }}>
              {formatCurrency(remaining > 0 ? remaining : 0)}
            </p>
            {debt.installment > 0 && (
              <p className="text-xs text-text-muted mt-1">
                Cicilan: {formatCurrency(debt.installment)}/bulan
                {debt.months > 0 && ` · ${debt.months} bulan`}
              </p>
            )}
          </div>

          {/* Akun sumber (hanya untuk hutang) */}
          {debt.kind === 'debt' && (
            <div>
              <label className="text-xs text-text-muted block mb-2">Dari Akun</label>
              <div className="flex gap-2 flex-wrap">
                {accounts.map((acc) => (
                  <button
                    key={acc.id} onClick={() => setAccountId(acc.id)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                      accountId === acc.id ? 'border-current' : 'border-border bg-input hover:bg-elevated text-text-secondary'
                    )}
                    style={accountId === acc.id ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color } : {}}
                  >
                    <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center shrink-0">
                      {acc.iconType === 'photo' && acc.iconPhoto
                        ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                        : <span className="text-xs">{acc.icon}</span>}
                    </div>
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xs opacity-60">{formatCurrency(acc.balance)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jumlah */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jumlah Pembayaran</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0" autoFocus
                className="flex-1 bg-transparent text-2xl font-bold text-text-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <input
              type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Keterangan pembayaran..." maxLength={60} className="input"
            />
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Pembayaran</button>
        </div>
      </div>
    </div>
  );
}

// ─── Debt Card ────────────────────────────────────────────────────
function DebtCard({ debt, onEdit, onDelete, onPay, onDeletePayment }) {
  const [showPayments, setShowPayments] = useState(false);

  const paid        = debt.paid || 0;
  const remaining   = debt.total - paid;
  const pct         = debt.total > 0 ? Math.min((paid / debt.total) * 100, 100) : 0;
  const isDone      = pct >= 100;
  const isDebt      = debt.kind === 'debt';
  const accentColor = isDebt ? '#FF6B6B' : '#A8E6CF';

  const days      = debt.dueDate ? Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = days !== null && days < 0 && !isDone;
  const isUrgent  = days !== null && days <= 7 && days >= 0 && !isDone;

  // Estimasi sisa bulan cicilan
  const sisBulan = debt.installment > 0 && remaining > 0
    ? Math.ceil(remaining / debt.installment) : null;

  return (
    <div className={clsx(
      'card space-y-3',
      isDone && 'border-income/30',
      isExpired && 'border-expense/40',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{isDebt ? '💸' : '🤝'}</span>
            <span className="font-bold text-text-primary">{debt.name}</span>
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isDebt ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income'
            )}>
              {isDebt ? 'Hutang' : 'Piutang'}
            </span>
            {isDone && <span className="text-xs bg-income/20 text-income px-2 py-0.5 rounded-full">✓ Lunas</span>}
            {isExpired && (
              <span className="text-xs bg-expense/20 text-expense px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} /> Jatuh Tempo
              </span>
            )}
          </div>
          {debt.note && <p className="text-xs text-text-muted mt-1 ml-7">{debt.note}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => onEdit(debt)} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(debt.id)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Amount info */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-text-muted mb-0.5">Sudah dibayar</p>
          <p className="text-lg font-bold text-income">{formatCurrency(paid)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-0.5">Total</p>
          <p className="text-base font-semibold text-text-primary">{formatCurrency(debt.total)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isDone ? '#A8E6CF' : accentColor }} />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        <span className="text-xs font-bold" style={{ color: isDone ? '#A8E6CF' : accentColor }}>
          {pct.toFixed(0)}% {isDone ? 'Lunas' : `· Sisa ${formatCurrency(remaining)}`}
        </span>
        <div className="flex items-center gap-3 flex-wrap">
          {debt.installment > 0 && !isDone && (
            <span className="text-xs text-text-muted">
              {formatCurrency(debt.installment)}/bln
              {debt.months > 0 && ` · ${debt.months} bln`}
              {sisBulan && ` · ~${sisBulan} bln lagi`}
            </span>
          )}
          {debt.dueDate && (
            <span className={clsx('flex items-center gap-1 text-xs',
              isExpired ? 'text-expense' : isUrgent ? 'text-secondary' : 'text-text-muted')}>
              <Calendar size={11} />
              {isDone
                ? formatDate(debt.dueDate, 'short')
                : isExpired ? `Lewat ${Math.abs(days)} hari`
                : days === 0 ? 'Hari ini!'
                : `${days} hari lagi`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isDone && (
          <button onClick={() => onPay(debt)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: accentColor + '20', color: accentColor }}>
            <Plus size={14} />
            {isDebt ? 'Bayar Cicilan' : 'Tandai Dibayar'}
          </button>
        )}
        {debt.payments?.length > 0 && (
          <button onClick={() => setShowPayments(!showPayments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-elevated hover:bg-border transition-colors text-xs text-text-secondary">
            {showPayments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {debt.payments.length} bayar
          </button>
        )}
      </div>

      {/* Payment history */}
      {showPayments && debt.payments?.length > 0 && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <p className="text-xs text-text-muted font-medium mb-2">Riwayat Pembayaran</p>
          {[...debt.payments].reverse().map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-elevated group transition-colors">
              <div>
                <span className="text-sm font-semibold text-income">+{formatCurrency(p.amount)}</span>
                {p.note && <span className="text-xs text-text-muted ml-2">{p.note}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{formatDate(p.date, 'short')}</span>
                <button onClick={() => onDeletePayment(debt.id, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-expense/60 hover:text-expense transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function Debt() {
  const { debts, addDebt, updateDebt, deleteDebt, addPayment, deletePayment } = useFinance();
  const [showModal,   setShowModal]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [payItem,     setPayItem]     = useState(null);
  const [filter,      setFilter]      = useState('all');

  const filtered = useMemo(() => {
    return debts.filter((d) => {
      if (filter === 'debt')       return d.kind === 'debt';
      if (filter === 'receivable') return d.kind === 'receivable';
      if (filter === 'active')     return (d.paid || 0) < d.total;
      if (filter === 'done')       return (d.paid || 0) >= d.total;
      return true;
    });
  }, [debts, filter]);

  const totalHutang     = debts.filter(d => d.kind === 'debt').reduce((s, d) => s + Math.max(d.total - (d.paid||0), 0), 0);
  const totalPiutang    = debts.filter(d => d.kind === 'receivable').reduce((s, d) => s + Math.max(d.total - (d.paid||0), 0), 0);
  const overdueCount    = debts.filter(d => {
    if (!d.dueDate || (d.paid||0) >= d.total) return false;
    return new Date(d.dueDate) < new Date();
  }).length;

  const handleEdit   = (item) => { setEditItem(item); setShowModal(true); };
  const handlePay    = (item) => { setPayItem(item);  setShowPayment(true); };
  const handleDelete = (id)   => {
    if (window.confirm('Hapus hutang/piutang ini beserta riwayat pembayarannya?')) deleteDebt(id);
  };
  const handleSave   = (data) => {
    if (data.id) updateDebt(data);
    else addDebt(data);
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hutang & Cicilan</h1>
          <p className="text-text-muted text-sm mt-0.5">Kelola hutang, piutang, dan cicilan</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Tambah
        </button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-3">
            <p className="text-xs text-text-muted mb-1">Total Hutang</p>
            <p className="text-sm font-bold text-expense">{formatCurrency(totalHutang)}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-text-muted mb-1">Total Piutang</p>
            <p className="text-sm font-bold text-income">{formatCurrency(totalPiutang)}</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-xs text-text-muted mb-1">Jatuh Tempo</p>
            <p className={clsx('text-sm font-bold', overdueCount > 0 ? 'text-expense' : 'text-text-secondary')}>
              {overdueCount > 0 ? `${overdueCount} item` : 'Aman'}
            </p>
          </div>
        </div>
      )}

      {/* Filter chips */}
      {debts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all',        label: 'Semua'      },
            { id: 'debt',       label: '💸 Hutang'   },
            { id: 'receivable', label: '🤝 Piutang'  },
            { id: 'active',     label: 'Belum Lunas' },
            { id: 'done',       label: 'Lunas'       },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                filter === f.id
                  ? 'bg-primary text-bg border-primary'
                  : 'border-border text-text-secondary hover:text-text-primary'
              )}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🏦"
          title={debts.length === 0 ? 'Belum ada hutang/piutang' : 'Tidak ada data di kategori ini'}
          subtitle={debts.length === 0 ? 'Klik Tambah untuk mencatat hutang atau piutang' : ''}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <DebtCard key={d.id} debt={d}
              onEdit={handleEdit} onDelete={handleDelete}
              onPay={handlePay} onDeletePayment={deletePayment}
            />
          ))}
        </div>
      )}

      {showModal && (
        <DebtModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave} existing={editItem}
        />
      )}
      {showPayment && payItem && (
        <PaymentModal
          debt={payItem}
          onClose={() => { setShowPayment(false); setPayItem(null); }}
          onAdd={addPayment}
        />
      )}
    </div>
  );
}
