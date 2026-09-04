import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Calendar, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, formatDate } from '../utils/formatters';
import clsx from 'clsx';

function DebtModal({ onClose, onSave, existing }) {
  const [kind,        setKind]        = useState(existing?.kind        || 'debt');
  const [name,        setName]        = useState(existing?.name        || '');
  const [total,       setTotal]       = useState(existing?.total       ? String(existing.total) : '');
  const [months,      setMonths]      = useState(existing?.months      ? String(existing.months) : '');
  const [installment, setInstallment] = useState(existing?.installment ? String(existing.installment) : '');
  const [dueDate,     setDueDate]     = useState(existing?.dueDate     || '');
  const [note,        setNote]        = useState(existing?.note        || '');

  const handleTotalChange = (v) => {
    setTotal(v);
    const t = parseFloat(v), m = parseInt(months);
    if (t > 0 && m > 0) setInstallment(String(Math.ceil(t / m)));
  };
  const handleMonthsChange = (v) => {
    setMonths(v);
    const t = parseFloat(total), m = parseInt(v);
    if (t > 0 && m > 0) setInstallment(String(Math.ceil(t / m)));
    else if (!v) setInstallment('');
  };

  const numTotal = parseFloat(total) || 0;
  const numMonths = parseInt(months) || 0;
  const numInstallment = parseFloat(installment) || 0;

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama hutang');
    if (!numTotal) return alert('Masukkan jumlah');
    onSave({ ...(existing || {}), kind, name: name.trim(), total: numTotal, months: numMonths, installment: numInstallment, dueDate, note: note.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{existing ? 'Edit' : 'Tambah Hutang/Piutang'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-bg rounded-xl p-1">
            {[{id:'debt',label:'💸 Hutang',sub:'Kamu berhutang'},{id:'receivable',label:'🤝 Piutang',sub:'Orang lain hutang'}].map((k) => (
              <button key={k.id} onClick={() => setKind(k.id)}
                className={clsx('py-2 px-3 rounded-lg text-left transition-all',
                  kind === k.id ? (k.id==='debt'?'bg-expense/20 text-expense':'bg-income/20 text-income') : 'text-text-muted')}>
                <p className="text-xs font-semibold">{k.label}</p>
                <p className="text-[10px] opacity-70">{k.sub}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama / Keterangan</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={kind==='debt'?'SpayLater, Cicilan HP...':'Pinjaman ke Andi'} maxLength={50} className="input" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Total {kind==='debt'?'Hutang':'Piutang'}</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={total} onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-2">Cicilan (opsional)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-text-muted mb-1">Bulan</p>
                <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50">
                  <input type="number" value={months} onChange={(e) => handleMonthsChange(e.target.value)}
                    placeholder="12" className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" min="1" />
                  <span className="text-text-muted text-[10px]">bln</span>
                </div>
              </div>
              <span className="text-text-muted pt-4">=</span>
              <div className="flex-1">
                <p className="text-[10px] text-text-muted mb-1">Per Bulan</p>
                <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50">
                  <span className="text-text-muted text-[10px]">Rp</span>
                  <input type="number" value={installment} onChange={(e) => setInstallment(e.target.value)}
                    placeholder="0" className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
                </div>
              </div>
            </div>
            {numTotal > 0 && numMonths > 0 && numInstallment > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 flex justify-between mt-1.5">
                <span className="text-[10px] text-primary">{numTotal.toLocaleString('id-ID')} ÷ {numMonths} bln</span>
                <span className="text-xs font-bold text-primary">{formatShortCurrency(numInstallment)}/bln</span>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jatuh Tempo (opsional)</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Keterangan..." maxLength={80} className="input" />
          </div>
          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ debt, onClose, onAdd }) {
  const { accounts } = useFinance();
  const [amount, setAmount]       = useState(debt.installment ? String(debt.installment) : '');
  const [note, setNote]           = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const remaining = debt.total - (debt.paid || 0);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah');
    if (debt.kind === 'debt' && accountId) {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc && num > acc.balance) return alert(`Saldo ${acc.name} tidak cukup`);
    }
    onAdd(debt.id, num, note.trim(), debt.kind === 'debt' ? accountId : '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{debt.kind==='debt'?'Bayar Cicilan':'Tandai Dibayar'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-bg rounded-xl p-2.5 text-center border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Sisa {debt.kind==='debt'?'hutang':'piutang'} · {debt.name}</p>
            <p className="text-lg font-bold" style={{ color: debt.kind==='debt'?'#FF6B6B':'#A8E6CF' }}>{formatCurrency(remaining > 0 ? remaining : 0)}</p>
            {debt.installment > 0 && <p className="text-[10px] text-text-muted mt-0.5">Cicilan: {formatShortCurrency(debt.installment)}/bln{debt.months>0?` · ${debt.months} bln`:''}</p>}
          </div>
          {debt.kind === 'debt' && (
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Dari Akun</label>
              <div className="flex gap-1.5 flex-wrap">
                {accounts.map((acc) => (
                  <button key={acc.id} onClick={() => setAccountId(acc.id)}
                    className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all',
                      accountId===acc.id?'border-current':'border-border bg-input text-text-secondary')}
                    style={accountId===acc.id?{borderColor:acc.color,backgroundColor:acc.color+'22',color:acc.color}:{}}>
                    <span>{acc.icon}</span> {acc.name} · {formatShortCurrency(acc.balance)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
            <span className="text-text-muted text-sm">Rp</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0" autoFocus className="flex-1 bg-transparent text-2xl font-bold text-text-primary focus:outline-none" />
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)" maxLength={60} className="input" />
          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Pembayaran</button>
        </div>
      </div>
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete, onPay, onDeletePayment, mobile }) {
  const [showPayments, setShowPayments] = useState(false);
  const paid        = debt.paid || 0;
  const remaining   = debt.total - paid;
  const pct         = debt.total > 0 ? Math.min((paid / debt.total) * 100, 100) : 0;
  const isDone      = pct >= 100;
  const isDebt      = debt.kind === 'debt';
  const accentColor = isDebt ? '#FF6B6B' : '#A8E6CF';
  const days        = debt.dueDate ? Math.ceil((new Date(debt.dueDate) - new Date()) / (1000*60*60*24)) : null;
  const isExpired   = days !== null && days < 0 && !isDone;
  const sisBulan    = debt.installment > 0 && remaining > 0 ? Math.ceil(remaining / debt.installment) : null;

  return (
    <div className={clsx('bg-card border border-border rounded-xl p-3 space-y-2', isDone&&'border-income/30', isExpired&&'border-expense/40')}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base">{isDebt?'💸':'🤝'}</span>
            <span className="text-xs font-bold text-text-primary truncate">{debt.name}</span>
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
              isDebt?'bg-expense/15 text-expense':'bg-income/15 text-income')}>
              {isDebt?'Hutang':'Piutang'}
            </span>
            {isDone && <span className="text-[10px] bg-income/20 text-income px-1.5 py-0.5 rounded-full shrink-0">✓ Lunas</span>}
            {isExpired && <span className="text-[10px] bg-expense/20 text-expense px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0"><AlertTriangle size={9} />Jatuh</span>}
          </div>
          {debt.note && <p className="text-[10px] text-text-muted mt-0.5 truncate ml-6">{debt.note}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(debt)} className="p-1 rounded-lg hover:bg-elevated text-text-muted"><Pencil size={12} /></button>
          <button onClick={() => onDelete(debt.id)} className="p-1 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense"><Trash2 size={12} /></button>
        </div>
      </div>

      <div className="flex justify-between text-xs">
        <span className="font-bold text-income">{mobile ? formatShortCurrency(paid) : formatCurrency(paid)}</span>
        <span className="text-text-muted">/ {mobile ? formatShortCurrency(debt.total) : formatCurrency(debt.total)}</span>
      </div>

      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isDone?'#A8E6CF':accentColor }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold" style={{ color: isDone?'#A8E6CF':accentColor }}>
          {pct.toFixed(0)}% {!isDone && `· Sisa ${mobile ? formatShortCurrency(remaining) : formatCurrency(remaining)}`}
        </span>
        <div className="flex items-center gap-2">
          {debt.installment > 0 && !isDone && (
            <span className="text-[10px] text-text-muted">
              {formatShortCurrency(debt.installment)}/bln{sisBulan ? ` ~${sisBulan}bln` : ''}
            </span>
          )}
          {debt.dueDate && (
            <span className={clsx('flex items-center gap-0.5 text-[10px]', isExpired?'text-expense':'text-text-muted')}>
              <Calendar size={10} />
              {isDone ? formatDate(debt.dueDate,'short') : isExpired ? `Lewat ${Math.abs(days)}h` : `${days}h`}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        {!isDone && (
          <button onClick={() => onPay(debt)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ backgroundColor: accentColor+'20', color: accentColor }}>
            <Plus size={12} /> {isDebt?'Bayar':'Dibayar'}
          </button>
        )}
        {debt.payments?.length > 0 && (
          <button onClick={() => setShowPayments(!showPayments)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-elevated text-xs text-text-secondary hover:bg-border">
            {showPayments?<ChevronUp size={11}/>:<ChevronDown size={11}/>} {debt.payments.length}
          </button>
        )}
      </div>

      {showPayments && debt.payments?.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          {[...debt.payments].reverse().slice(0,5).map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-elevated group transition-colors">
              <span className="text-xs font-semibold text-income">+{formatShortCurrency(p.amount)}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted">{formatDate(p.date,'short')}</span>
                <button onClick={() => onDeletePayment(debt.id, p.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-expense/60 hover:text-expense"><Trash2 size={10} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Debt() {
  const mobile = useIsMobile();
  const { debts, addDebt, updateDebt, deleteDebt, addPayment, deletePayment } = useFinance();
  const [showModal,   setShowModal]   = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [payItem,     setPayItem]     = useState(null);
  const [filter,      setFilter]      = useState('all');

  const filtered = useMemo(() => debts.filter((d) => {
    if (filter==='debt')       return d.kind==='debt';
    if (filter==='receivable') return d.kind==='receivable';
    if (filter==='active')     return (d.paid||0) < d.total;
    if (filter==='done')       return (d.paid||0) >= d.total;
    return true;
  }), [debts, filter]);

  const totalHutang  = debts.filter(d=>d.kind==='debt').reduce((s,d)=>s+Math.max(d.total-(d.paid||0),0),0);
  const totalPiutang = debts.filter(d=>d.kind==='receivable').reduce((s,d)=>s+Math.max(d.total-(d.paid||0),0),0);
  const overdueCount = debts.filter(d=>d.dueDate&&(d.paid||0)<d.total&&new Date(d.dueDate)<new Date()).length;

  const handleEdit   = (item) => { setEditItem(item); setShowModal(true); };
  const handlePay    = (item) => { setPayItem(item);  setShowPayment(true); };
  const handleDelete = (id)   => { if (window.confirm('Hapus hutang/piutang ini?')) deleteDebt(id); };
  const handleSave   = (data) => { if (data.id) updateDebt(data); else addDebt(data); };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-4xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile?'text-base':'text-2xl')}>Hutang & Cicilan</p>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Tambah
        </button>
      </div>

      {debts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Hutang',  val: totalHutang,  color: 'text-expense' },
            { label: 'Total Piutang', val: totalPiutang, color: 'text-income'  },
            { label: 'Jatuh Tempo',   val: overdueCount > 0 ? `${overdueCount} item` : 'Aman', isText: overdueCount === 0,
              color: overdueCount > 0 ? 'text-expense' : 'text-text-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-2 text-center">
              <p className="text-[10px] text-text-muted mb-0.5">{s.label}</p>
              <p className={clsx('text-xs font-bold', s.color)}>
                {typeof s.val === 'string' ? s.val : (mobile ? formatShortCurrency(s.val) : formatCurrency(s.val))}
              </p>
            </div>
          ))}
        </div>
      )}

      {debts.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {[{id:'all',label:'Semua'},{id:'debt',label:'💸 Hutang'},{id:'receivable',label:'🤝 Piutang'},{id:'active',label:'Belum Lunas'},{id:'done',label:'Lunas'}].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={clsx('px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all',
                filter===f.id?'bg-primary text-bg border-primary':'border-border text-text-secondary')}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState icon="🏦" title={debts.length===0?'Belum ada hutang/piutang':'Tidak ada'} subtitle={debts.length===0?'Tap Tambah untuk mencatat':''} />
        : <div className={clsx('grid gap-2', mobile?'grid-cols-1':'grid-cols-2')}>
            {filtered.map((d) => (
              <DebtCard key={d.id} debt={d} mobile={mobile}
                onEdit={handleEdit} onDelete={handleDelete} onPay={handlePay} onDeletePayment={deletePayment} />
            ))}
          </div>
      }

      {showModal && <DebtModal onClose={() => { setShowModal(false); setEditItem(null); }} onSave={handleSave} existing={editItem} />}
      {showPayment && payItem && <PaymentModal debt={payItem} onClose={() => { setShowPayment(false); setPayItem(null); }} onAdd={addPayment} />}
    </div>
  );
}
