import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Calendar, AlertTriangle, Info } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, formatDate } from '../utils/formatters';
import clsx from 'clsx';

// ─── Hitung cicilan dengan bunga flat ────────────────────────────
// Bunga flat: bunga = pokok × rate × n_tahun
// Cicilan/bln = (pokok + total_bunga) / n_bulan
function calcInstallment(total, months, interestRate) {
  if (!total || !months) return 0;
  const years        = months / 12;
  const totalInterest = total * (interestRate / 100) * years;
  const totalPayable  = total + totalInterest;
  return Math.ceil(totalPayable / months);
}

function calcTotalPayable(total, months, interestRate) {
  if (!total || !months) return total || 0;
  const years         = months / 12;
  const totalInterest = total * (interestRate / 100) * years;
  return total + totalInterest;
}

// ─── Debt Modal ───────────────────────────────────────────────────
function DebtModal({ onClose, onSave, existing }) {
  const [kind,         setKind]         = useState(existing?.kind         || 'debt');
  const [name,         setName]         = useState(existing?.name         || '');
  const [total,        setTotal]        = useState(existing?.total        ? String(existing.total) : '');
  const [months,       setMonths]       = useState(existing?.months       ? String(existing.months) : '');
  const [interestRate, setInterestRate] = useState(existing?.interestRate != null ? String(existing.interestRate) : '0');
  const [installment,  setInstallment]  = useState(existing?.installment  ? String(existing.installment) : '');
  const [dueDate,      setDueDate]      = useState(existing?.dueDate      || '');
  const [note,         setNote]         = useState(existing?.note         || '');

  // Auto-hitung cicilan saat total/bulan/bunga berubah
  const recalc = (t, m, r) => {
    const num = calcInstallment(parseFloat(t)||0, parseInt(m)||0, parseFloat(r)||0);
    if (num > 0) setInstallment(String(num));
    else setInstallment('');
  };

  const handleTotalChange = (v) => {
    setTotal(v);
    recalc(v, months, interestRate);
  };
  const handleMonthsChange = (v) => {
    setMonths(v);
    recalc(total, v, interestRate);
  };
  const handleRateChange = (v) => {
    setInterestRate(v);
    recalc(total, months, v);
  };

  const numTotal       = parseFloat(total)       || 0;
  const numMonths      = parseInt(months)         || 0;
  const numRate        = parseFloat(interestRate) || 0;
  const numInstallment = parseFloat(installment)  || 0;
  const totalPayable   = calcTotalPayable(numTotal, numMonths, numRate);
  const totalInterest  = totalPayable - numTotal;

  const handleSave = () => {
    if (!name.trim())  return alert('Masukkan nama hutang/piutang');
    if (!numTotal)     return alert('Masukkan jumlah');
    onSave({
      ...(existing || {}),
      kind, name: name.trim(),
      total:        numTotal,
      totalPayable: numMonths > 0 ? totalPayable : numTotal,
      months:       numMonths,
      interestRate: numRate,
      installment:  numInstallment,
      dueDate, note: note.trim(),
    });
    onClose();
  };

  const isDebtKind = kind === 'debt';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">
            {existing ? 'Edit' : 'Tambah'} Hutang/Piutang
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* ── Jenis: Hutang / Piutang ──────────── */}
          <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
            {[
              { id: 'debt',       label: 'Hutang',  sub: 'Kamu yang berhutang',       color: 'expense' },
              { id: 'receivable', label: 'Piutang', sub: 'Orang lain hutang ke kamu', color: 'income'  },
            ].map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)}
                className={clsx(
                  'py-3 px-3 rounded-lg text-left transition-all border',
                  kind === k.id
                    ? k.color === 'expense'
                      ? 'bg-expense/15 border-expense/40 text-expense'
                      : 'bg-income/15 border-income/40 text-income'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
                )}>
                <p className="text-sm font-bold">{k.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{k.sub}</p>
              </button>
            ))}
          </div>

          {/* ── Nama ─────────────────────────────── */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama / Keterangan</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={isDebtKind ? 'SpayLater, KPR, Hutang ke...' : 'Pinjaman ke Andi...'}
              maxLength={50} className="input" />
          </div>

          {/* ── Jumlah Pokok ─────────────────────── */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">
              Jumlah {isDebtKind ? 'Hutang' : 'Piutang'} (Pokok)
            </label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={total} onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none" />
            </div>
          </div>

          {/* ── Cicilan & Bunga ──────────────────── */}
          <div className="space-y-3">
            <label className="text-xs text-text-muted block">Cicilan & Bunga (opsional)</label>

            {/* Bulan + Bunga */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-text-muted mb-1">Jumlah Bulan</p>
                <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50">
                  <input type="number" value={months} onChange={(e) => handleMonthsChange(e.target.value)}
                    placeholder="12" min="1"
                    className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
                  <span className="text-text-muted text-[10px] shrink-0">bln</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-text-muted mb-1">Bunga / Tahun</p>
                <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50">
                  <input type="number" value={interestRate} onChange={(e) => handleRateChange(e.target.value)}
                    placeholder="0" min="0" step="0.1"
                    className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
                  <span className="text-text-muted text-[10px] shrink-0">%/thn</span>
                </div>
              </div>
            </div>

            {/* Cicilan per bulan (hasil kalkulasi) */}
            <div>
              <p className="text-[10px] text-text-muted mb-1">Cicilan per Bulan (hasil hitung otomatis)</p>
              <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-2.5 focus-within:border-primary/50">
                <span className="text-text-muted text-sm">Rp</span>
                <input type="number" value={installment} onChange={(e) => setInstallment(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-base font-bold text-text-primary focus:outline-none" />
                <span className="text-text-muted text-[10px]">/bln</span>
              </div>
            </div>

            {/* Ringkasan kalkulasi */}
            {numTotal > 0 && numMonths > 0 && (
              <div className="bg-elevated rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-text-muted">Pokok</span>
                  <span className="text-[11px] text-text-primary font-medium">{formatCurrency(numTotal)}</span>
                </div>
                {numRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-text-muted">Total Bunga ({numRate}%/thn × {(numMonths/12).toFixed(1)} thn)</span>
                    <span className="text-[11px] text-expense font-medium">+{formatCurrency(totalInterest)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-1.5">
                  <span className="text-xs font-semibold text-text-primary">Total Bayar</span>
                  <span className="text-xs font-bold text-primary">{formatCurrency(totalPayable)}</span>
                </div>
                {numInstallment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-text-muted">Cicilan</span>
                    <span className="text-[11px] text-text-primary font-medium">
                      {formatCurrency(numInstallment)}/bln × {numMonths} bln
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Jatuh Tempo ──────────────────────── */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jatuh Tempo (opsional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="input [color-scheme:dark]" />
          </div>

          {/* ── Catatan ──────────────────────────── */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Keterangan tambahan..." maxLength={80} className="input" />
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────
function PaymentModal({ debt, onClose, onAdd }) {
  const { accounts }    = useFinance();
  const [amount,        setAmount]    = useState(debt.installment ? String(debt.installment) : '');
  const [note,          setNote]      = useState('');
  const [accountId,     setAccountId] = useState(accounts[0]?.id || '');

  const remaining = (debt.totalPayable || debt.total) - (debt.paid || 0);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah pembayaran');
    if (debt.kind === 'debt' && accountId) {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc && num > acc.balance) return alert(`Saldo ${acc.name} tidak cukup (${formatCurrency(acc.balance)})`);
    }
    onAdd(debt.id, num, note.trim(), debt.kind === 'debt' ? accountId : '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">
            {debt.kind === 'debt' ? 'Bayar Cicilan' : 'Tandai Dibayar'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {/* Info sisa */}
          <div className="bg-bg rounded-xl p-3 border border-border space-y-1">
            <div className="flex justify-between">
              <span className="text-[11px] text-text-muted">Sisa {debt.kind === 'debt' ? 'hutang' : 'piutang'}</span>
              <span className="text-sm font-bold"
                style={{ color: debt.kind === 'debt' ? '#FF6B6B' : '#A8E6CF' }}>
                {formatCurrency(Math.max(remaining, 0))}
              </span>
            </div>
            {debt.installment > 0 && (
              <div className="flex justify-between">
                <span className="text-[11px] text-text-muted">Cicilan bulanan</span>
                <span className="text-[11px] text-text-primary">{formatCurrency(debt.installment)}/bln</span>
              </div>
            )}
            {debt.interestRate > 0 && (
              <div className="flex justify-between">
                <span className="text-[11px] text-text-muted">Bunga</span>
                <span className="text-[11px] text-expense">{debt.interestRate}%/tahun</span>
              </div>
            )}
          </div>

          {/* Akun (hanya hutang) */}
          {debt.kind === 'debt' && (
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Dari Akun</label>
              <div className="flex gap-1.5 flex-wrap">
                {accounts.map((acc) => (
                  <button key={acc.id} onClick={() => setAccountId(acc.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all',
                      accountId === acc.id ? 'border-current' : 'border-border bg-input text-text-secondary'
                    )}
                    style={accountId === acc.id
                      ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color }
                      : {}}>
                    <span className="text-sm">{acc.icon}</span>
                    <span>{acc.name}</span>
                    <span className="opacity-60">{formatShortCurrency(acc.balance)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Jumlah */}
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
            <span className="text-text-muted text-sm">Rp</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0" autoFocus
              className="flex-1 bg-transparent text-2xl font-bold text-text-primary focus:outline-none" />
          </div>

          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)" maxLength={60} className="input" />

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Pembayaran</button>
        </div>
      </div>
    </div>
  );
}

// ─── Debt Card ────────────────────────────────────────────────────
function DebtCard({ debt, onEdit, onDelete, onPay, onDeletePayment, mobile }) {
  const [showPayments, setShowPayments] = useState(false);

  const paid         = debt.paid || 0;
  const totalPayable = debt.totalPayable || debt.total;
  const remaining    = totalPayable - paid;
  const pct          = totalPayable > 0 ? Math.min((paid / totalPayable) * 100, 100) : 0;
  const isDone       = pct >= 100;
  const isDebt       = debt.kind === 'debt';
  const accentColor  = isDebt ? '#FF6B6B' : '#A8E6CF';

  const days      = debt.dueDate ? Math.ceil((new Date(debt.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = days !== null && days < 0 && !isDone;
  const sisBulan  = debt.installment > 0 && remaining > 0 ? Math.ceil(remaining / debt.installment) : null;

  return (
    <div className={clsx(
      'bg-card border border-border rounded-xl p-3 space-y-2',
      isDone && 'border-income/30',
      isExpired && 'border-expense/40'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={clsx(
              'text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0',
              isDebt ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income'
            )}>
              {isDebt ? 'Hutang' : 'Piutang'}
            </span>
            <span className="text-xs font-bold text-text-primary truncate">{debt.name}</span>
            {isDone && (
              <span className="text-[10px] bg-income/20 text-income px-1.5 py-0.5 rounded-full shrink-0">
                Lunas
              </span>
            )}
            {isExpired && (
              <span className="text-[10px] bg-expense/20 text-expense px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <AlertTriangle size={9} /> Jatuh
              </span>
            )}
          </div>
          {debt.note && (
            <p className="text-[10px] text-text-muted mt-0.5 truncate">{debt.note}</p>
          )}
          {debt.interestRate > 0 && (
            <p className="text-[10px] text-expense/70 mt-0.5">
              Bunga {debt.interestRate}%/thn · Total bayar {mobile ? formatShortCurrency(totalPayable) : formatCurrency(totalPayable)}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(debt)} className="p-1 rounded-lg hover:bg-elevated text-text-muted">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(debt.id)} className="p-1 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex justify-between text-xs">
        <span className="font-bold text-income">{mobile ? formatShortCurrency(paid) : formatCurrency(paid)}</span>
        <span className="text-text-muted">/ {mobile ? formatShortCurrency(totalPayable) : formatCurrency(totalPayable)}</span>
      </div>

      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: isDone ? '#A8E6CF' : accentColor }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: isDone ? '#A8E6CF' : accentColor }}>
          {pct.toFixed(0)}% {!isDone && `· Sisa ${mobile ? formatShortCurrency(remaining) : formatCurrency(remaining)}`}
        </span>
        <div className="flex items-center gap-2">
          {debt.installment > 0 && !isDone && (
            <span className="text-[10px] text-text-muted">
              {formatShortCurrency(debt.installment)}/bln{sisBulan ? ` ~${sisBulan}bln` : ''}
            </span>
          )}
          {debt.dueDate && (
            <span className={clsx('flex items-center gap-0.5 text-[10px]', isExpired ? 'text-expense' : 'text-text-muted')}>
              <Calendar size={10} />
              {isDone ? formatDate(debt.dueDate, 'short')
                : isExpired ? `Lewat ${Math.abs(days)}h`
                : `${days}h lagi`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        {!isDone && (
          <button onClick={() => onPay(debt)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ backgroundColor: accentColor + '20', color: accentColor }}>
            <Plus size={12} /> {isDebt ? 'Bayar' : 'Dibayar'}
          </button>
        )}
        {debt.payments?.length > 0 && (
          <button onClick={() => setShowPayments(!showPayments)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-elevated text-xs text-text-secondary hover:bg-border">
            {showPayments ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {debt.payments.length}
          </button>
        )}
      </div>

      {/* Payment history */}
      {showPayments && debt.payments?.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          {[...debt.payments].reverse().slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-elevated group transition-colors">
              <span className="text-xs font-semibold text-income">+{formatShortCurrency(p.amount)}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted">{formatDate(p.date, 'short')}</span>
                <button onClick={() => onDeletePayment(debt.id, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-expense/60 hover:text-expense">
                  <Trash2 size={10} />
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
  const mobile = useIsMobile();
  const { debts, addDebt, updateDebt, deleteDebt, addPayment, deletePayment } = useFinance();
  const [showModal,   setShowModal]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [payItem,     setPayItem]     = useState(null);
  const [filter,      setFilter]      = useState('all');

  const filtered = useMemo(() => debts.filter((d) => {
    if (filter === 'hutang')   return d.kind === 'debt';
    if (filter === 'piutang')  return d.kind === 'receivable';
    if (filter === 'aktif')    return (d.paid || 0) < (d.totalPayable || d.total);
    if (filter === 'lunas')    return (d.paid || 0) >= (d.totalPayable || d.total);
    return true;
  }), [debts, filter]);

  const totalHutang  = debts.filter(d => d.kind === 'debt')
    .reduce((s, d) => s + Math.max((d.totalPayable || d.total) - (d.paid || 0), 0), 0);
  const totalPiutang = debts.filter(d => d.kind === 'receivable')
    .reduce((s, d) => s + Math.max((d.totalPayable || d.total) - (d.paid || 0), 0), 0);
  const overdueCount = debts.filter(d =>
    d.dueDate && (d.paid || 0) < (d.totalPayable || d.total) && new Date(d.dueDate) < new Date()
  ).length;

  const handleEdit   = (item) => { setEditItem(item); setShowModal(true); };
  const handlePay    = (item) => { setPayItem(item);  setShowPayment(true); };
  const handleDelete = (id)   => { if (window.confirm('Hapus hutang/piutang ini?')) deleteDebt(id); };
  const handleSave   = (data) => { if (data.id) updateDebt(data); else addDebt(data); };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-4xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>
          Hutang & Cicilan
        </p>
        <button
          onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Tambah
        </button>
      </div>

      {/* Summary */}
      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Hutang',  val: totalHutang,  color: 'text-expense' },
            { label: 'Total Piutang', val: totalPiutang, color: 'text-income'  },
            { label: 'Jatuh Tempo',   val: overdueCount > 0 ? `${overdueCount} item` : 'Aman',
              isText: true, color: overdueCount > 0 ? 'text-expense' : 'text-text-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
              <p className="text-[10px] text-text-muted mb-0.5">{s.label}</p>
              <p className={clsx('text-xs font-bold', s.color)}>
                {s.isText ? s.val : (mobile ? formatShortCurrency(s.val) : formatCurrency(s.val))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips — tanpa emoticon */}
      {debts.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {[
            { id: 'all',     label: 'Semua'       },
            { id: 'hutang',  label: 'Hutang'       },
            { id: 'piutang', label: 'Piutang'      },
            { id: 'aktif',   label: 'Belum Lunas'  },
            { id: 'lunas',   label: 'Lunas'        },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all',
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
      {filtered.length === 0
        ? <EmptyState
            icon="🏦"
            title={debts.length === 0 ? 'Belum ada hutang/piutang' : 'Tidak ada'}
            subtitle={debts.length === 0 ? 'Tap Tambah untuk mencatat' : ''}
          />
        : <div className={clsx('grid gap-2', mobile ? 'grid-cols-1' : 'grid-cols-2')}>
            {filtered.map((d) => (
              <DebtCard key={d.id} debt={d} mobile={mobile}
                onEdit={handleEdit} onDelete={handleDelete}
                onPay={handlePay} onDeletePayment={deletePayment} />
            ))}
          </div>
      }

      {showModal && (
        <DebtModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          existing={editItem}
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
