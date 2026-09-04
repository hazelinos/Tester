import { useState, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, Camera, PiggyBank, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, formatDate } from '../utils/formatters';
import clsx from 'clsx';

const daysLeft = (deadline) => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
};

function SavingModal({ onClose, onSave, existing }) {
  const [name, setName]         = useState(existing?.name    || '');
  const [target, setTarget]     = useState(existing?.target  ? String(existing.target) : '');
  const [deadline, setDeadline] = useState(existing?.deadline || '');
  const [note, setNote]         = useState(existing?.note    || '');
  const [photo, setPhoto]       = useState(existing?.photo   || null);
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Max 3MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama target');
    const num = parseFloat(target);
    if (!num || num <= 0) return alert('Masukkan jumlah yang valid');
    onSave({ ...(existing || {}), name: name.trim(), target: num, deadline, note: note.trim(), photo });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{existing ? 'Edit Target' : 'Target Baru'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          {photo ? (
            <div className="relative rounded-xl overflow-hidden h-28">
              <img src={photo} alt="target" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                <button onClick={() => fileRef.current?.click()} className="bg-white/20 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1"><Camera size={11} /> Ganti</button>
                <button onClick={() => setPhoto(null)} className="bg-expense/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1"><Trash2 size={11} /> Hapus</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all">
              <Camera size={18} className="text-text-muted" />
              <span className="text-xs text-text-muted">Foto impian (opsional)</span>
            </button>
          )}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama Target</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beli Laptop, Liburan..." maxLength={40} className="input" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jumlah Target</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Deadline (opsional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input [color-scheme:dark]" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Motivasi..." maxLength={80} className="input" />
          </div>
          <button onClick={handleSave} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <PiggyBank size={15} /> {existing ? 'Simpan' : 'Buat Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ saving, onClose, onAdd }) {
  const { accounts } = useFinance();
  const [amount, setAmount]       = useState(saving.installment ? String(saving.installment) : '');
  const [note, setNote]           = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const remaining = saving.target - saving.collected;

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah setoran');
    if (!accountId) return alert('Pilih akun sumber');
    const acc = accounts.find((a) => a.id === accountId);
    if (acc && num > acc.balance) return alert(`Saldo ${acc.name} tidak cukup`);
    onAdd(saving.id, num, note.trim(), accountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">Tambah Setoran</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-bg rounded-xl p-2.5 text-center border border-border">
            <p className="text-[10px] text-text-muted mb-0.5">Sisa target · {saving.name}</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(remaining > 0 ? remaining : 0)}</p>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Dari Akun</label>
            <div className="flex gap-1.5 flex-wrap">
              {accounts.map((acc) => (
                <button key={acc.id} onClick={() => setAccountId(acc.id)}
                  className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all',
                    accountId === acc.id ? 'border-current' : 'border-border bg-input text-text-secondary')}
                  style={accountId === acc.id ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color } : {}}>
                  <span>{acc.icon}</span> {acc.name} · {formatShortCurrency(acc.balance)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jumlah</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0" autoFocus className="flex-1 bg-transparent text-2xl font-bold text-primary focus:outline-none" />
            </div>
          </div>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)" maxLength={60} className="input" />
          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Setoran</button>
        </div>
      </div>
    </div>
  );
}

function SavingCard({ saving, onEdit, onDelete, onDeposit, onDeleteDeposit, mobile }) {
  const [showDeposits, setShowDeposits] = useState(false);
  const pct      = saving.target > 0 ? Math.min((saving.collected / saving.target) * 100, 100) : 0;
  const isDone   = pct >= 100;
  const days     = daysLeft(saving.deadline);
  const isExpired = days !== null && days < 0;
  const barColor  = isDone ? '#A8E6CF' : isExpired ? '#FF6B6B' : days !== null && days <= 7 ? '#FFD3A5' : '#A8E6CF';

  return (
    <div className={clsx('bg-card border border-border rounded-xl overflow-hidden', isDone && 'border-income/30')}>
      {saving.photo && (
        <div className="relative h-24 overflow-hidden">
          <img src={saving.photo} alt={saving.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {isDone && <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl">🎉</span></div>}
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={() => onEdit(saving)} className="p-1 rounded-lg bg-black/40 text-white"><Pencil size={11} /></button>
            <button onClick={() => onDelete(saving.id)} className="p-1 rounded-lg bg-black/40 text-white"><Trash2 size={11} /></button>
          </div>
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {!saving.photo && <PiggyBank size={13} className="text-primary shrink-0" />}
              <span className="text-sm font-bold text-text-primary truncate">{saving.name}</span>
              {isDone && <span className="text-[10px] bg-income/20 text-income px-1.5 py-0.5 rounded-full">✓ Tercapai</span>}
            </div>
            {saving.note && <p className="text-[10px] text-text-muted mt-0.5 truncate">{saving.note}</p>}
          </div>
          {!saving.photo && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(saving)} className="p-1 rounded-lg hover:bg-elevated text-text-muted"><Pencil size={12} /></button>
              <button onClick={() => onDelete(saving.id)} className="p-1 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense"><Trash2 size={12} /></button>
            </div>
          )}
        </div>

        <div className="flex justify-between text-xs">
          <span className="font-bold" style={{ color: barColor }}>{mobile ? formatShortCurrency(saving.collected) : formatCurrency(saving.collected)}</span>
          <span className="text-text-muted">/ {mobile ? formatShortCurrency(saving.target) : formatCurrency(saving.target)}</span>
        </div>

        <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold" style={{ color: barColor }}>{pct.toFixed(0)}%</span>
          <div className="flex items-center gap-2">
            {saving.deadline && (
              <span className={clsx('flex items-center gap-1 text-[10px]', isExpired ? 'text-expense' : 'text-text-muted')}>
                <Calendar size={10} />
                {isDone ? formatDate(saving.deadline, 'short') : isExpired ? `Lewat ${Math.abs(days)}h` : `${days}h lagi`}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1.5">
          {!isDone && (
            <button onClick={() => onDeposit(saving)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
              <Plus size={12} /> Setor
            </button>
          )}
          {saving.deposits?.length > 0 && (
            <button onClick={() => setShowDeposits(!showDeposits)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-elevated text-xs text-text-secondary hover:bg-border transition-colors">
              {showDeposits ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {saving.deposits.length}
            </button>
          )}
        </div>

        {showDeposits && saving.deposits?.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            {[...saving.deposits].reverse().slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-elevated group transition-colors">
                <span className="text-xs font-semibold text-income">+{formatShortCurrency(d.amount)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-text-muted">{formatDate(d.date, 'short')}</span>
                  <button onClick={() => onDeleteDeposit(saving.id, d.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-expense/60 hover:text-expense transition-all">
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Savings() {
  const mobile = useIsMobile();
  const { savings, addSaving, updateSaving, deleteSaving, addDeposit, deleteDeposit } = useFinance();
  const [showModal,   setShowModal]   = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [depositItem, setDepositItem] = useState(null);
  const [filter,      setFilter]      = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'active') return savings.filter((s) => s.collected < s.target);
    if (filter === 'done')   return savings.filter((s) => s.collected >= s.target);
    return savings;
  }, [savings, filter]);

  const totalTarget    = savings.reduce((s, g) => s + g.target, 0);
  const totalCollected = savings.reduce((s, g) => s + g.collected, 0);
  const doneCount      = savings.filter((g) => g.collected >= g.target).length;

  const handleEdit    = (item) => { setEditItem(item); setShowModal(true); };
  const handleDeposit = (item) => { setDepositItem(item); setShowDeposit(true); };
  const handleDelete  = (id)   => { if (window.confirm('Hapus target ini?')) deleteSaving(id); };
  const handleSave    = (data) => { if (data.id) updateSaving(data); else addSaving(data); };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-4xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>Tabungan</p>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Target Baru
        </button>
      </div>

      {savings.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Target',   val: totalTarget,    color: 'text-text-primary' },
            { label: 'Terkumpul', val: totalCollected, color: 'text-income'      },
            { label: 'Tercapai', val: `${doneCount}/${savings.length}`, isText: true, color: 'text-primary' },
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

      {savings.length > 0 && (
        <div className="flex gap-1.5">
          {[{id:'all',label:'Semua'},{id:'active',label:'Berjalan'},{id:'done',label:'Tercapai'}].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-all',
                filter === f.id ? 'bg-primary text-bg border-primary' : 'border-border text-text-secondary')}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0
        ? <EmptyState icon="🐷" title={savings.length === 0 ? 'Belum ada target' : 'Tidak ada'} subtitle={savings.length === 0 ? 'Tap Target Baru untuk mulai' : ''} />
        : <div className={clsx('grid gap-2', mobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3')}>
            {filtered.map((s) => (
              <SavingCard key={s.id} saving={s} mobile={mobile}
                onEdit={handleEdit} onDelete={handleDelete}
                onDeposit={handleDeposit} onDeleteDeposit={deleteDeposit} />
            ))}
          </div>
      }

      {showModal && (
        <SavingModal onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave} existing={editItem} />
      )}
      {showDeposit && depositItem && (
        <DepositModal saving={depositItem}
          onClose={() => { setShowDeposit(false); setDepositItem(null); }}
          onAdd={addDeposit} />
      )}
    </div>
  );
}
