import { useState, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, Camera, PiggyBank, Target, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, generateId } from '../utils/formatters';
import clsx from 'clsx';

// ─── Helpers ─────────────────────────────────────────────────────
const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
};

// ─── Saving Goal Modal ───────────────────────────────────────────
function SavingModal({ onClose, onSave, existing }) {
  const [name,     setName]     = useState(existing?.name     || '');
  const [target,   setTarget]   = useState(existing?.target   ? String(existing.target) : '');
  const [deadline, setDeadline] = useState(existing?.deadline || '');
  const [note,     setNote]     = useState(existing?.note     || '');
  const [photo,    setPhoto]    = useState(existing?.photo    || null);
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Ukuran foto maksimal 3MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama target tabungan');
    const num = parseFloat(target);
    if (!num || num <= 0) return alert('Masukkan jumlah target yang valid');
    onSave({ ...(existing || {}), name: name.trim(), target: num, deadline, note: note.trim(), photo });
    onClose();
  };

  const progress = existing
    ? Math.min((existing.collected / parseFloat(target || 1)) * 100, 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">
            {existing ? 'Edit Target' : 'Target Tabungan Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Photo upload */}
          <div>
            <label className="text-xs text-text-muted block mb-2">Foto Target (opsional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            {photo ? (
              <div className="relative rounded-xl overflow-hidden h-36">
                <img src={photo} alt="target" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                  <button onClick={() => fileRef.current?.click()}
                    className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                    <Camera size={12} /> Ganti
                  </button>
                  <button onClick={() => setPhoto(null)}
                    className="bg-expense/60 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Camera size={20} className="text-text-muted" />
                <span className="text-xs text-text-muted">Upload foto impian kamu</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama Target</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beli Laptop, Liburan Bali..." maxLength={40} className="input" />
          </div>

          {/* Target amount */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jumlah Target</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)}
                placeholder="0" className="flex-1 bg-transparent text-xl font-bold text-text-primary focus:outline-none" />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Deadline (opsional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="input [color-scheme:dark]" />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Motivasi atau catatan tambahan..." rows={2} maxLength={120}
              className="input resize-none" />
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <PiggyBank size={16} />
            {existing ? 'Simpan Perubahan' : 'Buat Target'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deposit Modal ───────────────────────────────────────────────
function DepositModal({ saving, onClose, onAdd }) {
  const { accounts } = useFinance();
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  const remaining = saving.target - saving.collected;
  const selectedAcc = accounts.find((a) => a.id === accountId);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return alert('Masukkan jumlah setoran');
    if (!accountId) return alert('Pilih akun sumber');
    if (selectedAcc && num > selectedAcc.balance)
      return alert(`Saldo ${selectedAcc.name} tidak cukup (${formatCurrency(selectedAcc.balance)})`);
    onAdd(saving.id, num, note.trim(), accountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">Tambah Setoran</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-bg rounded-xl p-3 text-center border border-border">
            <p className="text-xs text-text-muted mb-1">Sisa target untuk <span className="text-text-secondary font-medium">{saving.name}</span></p>
            <p className="text-xl font-bold text-primary">{formatCurrency(remaining > 0 ? remaining : 0)}</p>
          </div>

          {/* Akun sumber */}
          <div>
            <label className="text-xs text-text-muted block mb-2">Dari Akun</label>
            <div className="flex gap-2 flex-wrap">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all',
                    accountId === acc.id
                      ? 'border-current'
                      : 'border-border bg-input hover:bg-elevated text-text-secondary'
                  )}
                  style={accountId === acc.id ? { borderColor: acc.color, backgroundColor: acc.color + '22', color: acc.color } : {}}
                >
                  <span>{acc.iconType === 'photo' && acc.iconPhoto
                    ? <img src={acc.iconPhoto} alt={acc.name} className="w-4 h-4 rounded object-cover inline" />
                    : acc.icon}
                  </span>
                  <span className="font-medium">{acc.name}</span>
                  <span className="text-xs opacity-70">{formatCurrency(acc.balance)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1.5">Jumlah Setoran</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0" autoFocus
                className="flex-1 bg-transparent text-2xl font-bold text-primary focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1.5">Catatan (opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Dari mana uang ini..." maxLength={60} className="input" />
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Setoran</button>
        </div>
      </div>
    </div>
  );
}

// ─── Saving Card ─────────────────────────────────────────────────
function SavingCard({ saving, onEdit, onDelete, onDeposit, onDeleteDeposit }) {
  const [showDeposits, setShowDeposits] = useState(false);

  const pct      = saving.target > 0 ? Math.min((saving.collected / saving.target) * 100, 100) : 0;
  const isDone   = pct >= 100;
  const days     = daysLeft(saving.deadline);
  const isExpired = days !== null && days < 0;

  const barColor = isDone ? '#A8E6CF' : isExpired ? '#FF6B6B' : days !== null && days <= 7 ? '#FFD3A5' : '#A8E6CF';

  return (
    <div className={clsx('card overflow-hidden', isDone && 'border-income/30')}>
      {/* Photo */}
      {saving.photo && (
        <div className="relative -mx-4 -mt-4 mb-4 h-36 overflow-hidden rounded-t-2xl">
          <img src={saving.photo} alt={saving.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {isDone && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">🎉</span>
            </div>
          )}
          {/* Actions overlay */}
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button onClick={() => onEdit(saving)}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={() => onDelete(saving.id)}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-expense/60 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {!saving.photo && <PiggyBank size={16} className="text-primary shrink-0" />}
            <h3 className="font-bold text-text-primary">{saving.name}</h3>
            {isDone && <span className="text-xs bg-income/20 text-income px-2 py-0.5 rounded-full font-medium">✓ Tercapai</span>}
          </div>
          {saving.note && <p className="text-xs text-text-muted mt-0.5 ml-6">{saving.note}</p>}
        </div>
        {!saving.photo && (
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => onEdit(saving)}
              className="p-1.5 rounded-lg hover:bg-elevated text-text-muted transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(saving.id)}
              className="p-1.5 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Amount info */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-xs text-text-muted mb-0.5">Terkumpul</p>
          <p className="text-lg font-bold" style={{ color: barColor }}>{formatCurrency(saving.collected)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-0.5">Target</p>
          <p className="text-base font-semibold text-text-primary">{formatCurrency(saving.target)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold" style={{ color: barColor }}>{pct.toFixed(1)}%</span>
        <div className="flex items-center gap-3">
          {saving.deadline && (
            <div className={clsx('flex items-center gap-1 text-xs', isExpired ? 'text-expense' : days <= 7 ? 'text-secondary' : 'text-text-muted')}>
              <Calendar size={11} />
              {isDone ? formatDate(saving.deadline, 'short')
                : isExpired ? `Lewat ${Math.abs(days)} hari`
                : days === 0 ? 'Hari ini!'
                : `${days} hari lagi`}
            </div>
          )}
          {!isDone && (
            <span className="text-xs text-text-muted">
              Sisa {formatCurrency(Math.max(saving.target - saving.collected, 0))}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isDone && (
          <button onClick={() => onDeposit(saving)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold">
            <Plus size={14} /> Tambah Setoran
          </button>
        )}
        {saving.deposits?.length > 0 && (
          <button onClick={() => setShowDeposits(!showDeposits)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-elevated hover:bg-border transition-colors text-xs text-text-secondary">
            {showDeposits ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {saving.deposits.length} setoran
          </button>
        )}
      </div>

      {/* Deposit history */}
      {showDeposits && saving.deposits?.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          <p className="text-xs text-text-muted font-medium mb-2">Riwayat Setoran</p>
          {[...saving.deposits].reverse().map((d) => (
            <div key={d.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-elevated group transition-colors">
              <div>
                <span className="text-sm font-semibold text-income">+{formatCurrency(d.amount)}</span>
                {d.note && <span className="text-xs text-text-muted ml-2">{d.note}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{formatDate(d.date, 'short')}</span>
                <button onClick={() => onDeleteDeposit(saving.id, d.id)}
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

// ─── Page ────────────────────────────────────────────────────────
export default function Savings() {
  const { savings, addSaving, updateSaving, deleteSaving, addDeposit, deleteDeposit } = useFinance();
  const [showModal,    setShowModal]    = useState(false);
  const [showDeposit,  setShowDeposit]  = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [depositItem,  setDepositItem]  = useState(null);
  const [filter,       setFilter]       = useState('all'); // 'all' | 'active' | 'done'

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

  const handleDelete  = (id) => {
    if (window.confirm('Hapus target tabungan ini beserta semua riwayat setorannya?'))
      deleteSaving(id);
  };

  const handleSave = (data) => {
    if (data.id) updateSaving(data);
    else addSaving(data);
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tabungan</h1>
          <p className="text-text-muted text-sm mt-0.5">Kelola target & goals tabunganmu</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={15} /> Target Baru
        </button>
      </div>

      {/* Summary */}
      {savings.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Target',    val: formatCurrency(totalTarget),    color: 'text-text-primary' },
            { label: 'Terkumpul',       val: formatCurrency(totalCollected), color: 'text-income'       },
            { label: 'Goals Tercapai',  val: `${doneCount} / ${savings.length}`, color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="card text-center py-3">
              <p className="text-xs text-text-muted mb-1">{s.label}</p>
              <p className={clsx('text-sm font-bold', s.color)}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {savings.length > 0 && (
        <div className="flex gap-2">
          {[
            { id: 'all',    label: 'Semua'    },
            { id: 'active', label: 'Berjalan' },
            { id: 'done',   label: 'Tercapai' },
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

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🐷"
          title={savings.length === 0 ? 'Belum ada target tabungan' : 'Tidak ada target di kategori ini'}
          subtitle={savings.length === 0 ? 'Klik Target Baru untuk mulai menabung' : ''}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <SavingCard
              key={s.id}
              saving={s}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDeposit={handleDeposit}
              onDeleteDeposit={deleteDeposit}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <SavingModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          existing={editItem}
        />
      )}
      {showDeposit && depositItem && (
        <DepositModal
          saving={depositItem}
          onClose={() => { setShowDeposit(false); setDepositItem(null); }}
          onAdd={addDeposit}
        />
      )}
    </div>
  );
}
