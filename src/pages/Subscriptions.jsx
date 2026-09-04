import { useState, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, Camera, Bell, BellOff, Calendar, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, formatDate, generateId } from '../utils/formatters';
import clsx from 'clsx';

// ─── Kategori langganan ───────────────────────────────────────────
const SUB_CATEGORIES = [
  { id: 'streaming', label: 'Streaming',  icon: '📺', color: '#FF6B6B',
    examples: ['Netflix','Disney+','Vidio','WeTV'] },
  { id: 'music',     label: 'Musik',      icon: '🎵', color: '#C469FF',
    examples: ['Spotify','Apple Music','YouTube Music'] },
  { id: 'internet',  label: 'Internet',   icon: '📡', color: '#69B4FF',
    examples: ['WiFi','Paket Data','IndiHome'] },
  { id: 'apps',      label: 'Aplikasi',   icon: '📱', color: '#69FFD3',
    examples: ['iCloud','Google One','Canva Pro'] },
  { id: 'games',     label: 'Game',       icon: '🎮', color: '#FFD369',
    examples: ['Xbox Game Pass','PlayStation Plus'] },
  { id: 'news',      label: 'Berita',     icon: '📰', color: '#FF9F69',
    examples: ['Kompas Premium','The Athletic'] },
  { id: 'fitness',   label: 'Fitness',    icon: '💪', color: '#6BCF9F',
    examples: ['Gym','Classpass'] },
  { id: 'software',  label: 'Software',   icon: '💻', color: '#A8E6CF',
    examples: ['Adobe CC','Microsoft 365','Notion'] },
  { id: 'other',     label: 'Lainnya',    icon: '📦', color: '#AAAAAA',
    examples: [] },
];

const BILLING_CYCLES = [
  { id: 'monthly',   label: 'Bulanan'   },
  { id: 'quarterly', label: '3 Bulan'   },
  { id: 'yearly',    label: 'Tahunan'   },
];

// Hitung tagihan per bulan berdasarkan siklus
const monthlyEquivalent = (amount, cycle) => {
  if (cycle === 'quarterly') return amount / 3;
  if (cycle === 'yearly')    return amount / 12;
  return amount;
};

// Hitung hari ke jatuh tempo berikutnya
const daysUntilNext = (billingDay, cycle) => {
  const today     = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);
  let next        = thisMonth;
  if (next <= today) {
    if (cycle === 'monthly') {
      next = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
    } else if (cycle === 'quarterly') {
      next = new Date(today.getFullYear(), today.getMonth() + 3, billingDay);
    } else {
      next = new Date(today.getFullYear() + 1, today.getMonth(), billingDay);
    }
  }
  return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
};

// ─── Subscription Modal ───────────────────────────────────────────
function SubModal({ onClose, onSave, existing }) {
  const { accounts } = useFinance();
  const [name,        setName]       = useState(existing?.name       || '');
  const [categoryId,  setCategoryId] = useState(existing?.categoryId || 'streaming');
  const [amount,      setAmount]     = useState(existing?.amount     ? String(existing.amount) : '');
  const [cycle,       setCycle]      = useState(existing?.cycle      || 'monthly');
  const [billingDay,  setBillingDay] = useState(existing?.billingDay ? String(existing.billingDay) : '1');
  const [accountId,   setAccountId]  = useState(existing?.accountId  || accounts[0]?.id || '');
  const [note,        setNote]       = useState(existing?.note       || '');
  const [photo,       setPhoto]      = useState(existing?.photo      || null);
  const [active,      setActive]     = useState(existing?.active !== false);
  const fileRef = useRef(null);

  const selectedCat = SUB_CATEGORIES.find(c => c.id === categoryId);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim())               return alert('Masukkan nama langganan');
    if (!parseFloat(amount))        return alert('Masukkan jumlah tagihan');
    if (!accountId)                 return alert('Pilih akun pembayaran');
    onSave({
      ...(existing || {}),
      name:       name.trim(),
      categoryId,
      amount:     parseFloat(amount),
      cycle,
      billingDay: parseInt(billingDay) || 1,
      accountId,
      note:       note.trim(),
      photo,
      active,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">
            {existing ? 'Edit Langganan' : 'Tambah Langganan'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Photo + preview */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-border flex items-center justify-center text-3xl"
                style={{ backgroundColor: selectedCat?.color + '22' }}>
                {photo
                  ? <img src={photo} alt="" className="w-full h-full object-cover" />
                  : selectedCat?.icon}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Camera size={10} className="text-bg" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </div>
            <div className="flex-1">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Nama layanan (Netflix, Spotify...)" maxLength={40}
                className="input text-sm font-semibold" />
              {selectedCat?.examples.length > 0 && !name && (
                <p className="text-[10px] text-text-muted mt-1">
                  Contoh: {selectedCat.examples.slice(0,3).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="text-xs text-text-muted block mb-2">Kategori</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SUB_CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-xl border text-xs transition-all',
                    categoryId === cat.id ? 'border-current' : 'border-border bg-input hover:bg-elevated'
                  )}
                  style={categoryId === cat.id
                    ? { borderColor: cat.color, backgroundColor: cat.color + '22', color: cat.color }
                    : {}}>
                  <span className="text-base">{cat.icon}</span>
                  <span className={clsx('text-[10px] font-medium truncate',
                    categoryId !== cat.id && 'text-text-secondary')}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tagihan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Tagihan</label>
              <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50">
                <span className="text-text-muted text-xs">Rp</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-transparent text-sm font-bold text-text-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Siklus</label>
              <select value={cycle} onChange={(e) => setCycle(e.target.value)}
                className="input text-sm [color-scheme:dark]">
                {BILLING_CYCLES.map(b => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tagihan bulanan equivalent */}
          {amount && parseFloat(amount) > 0 && cycle !== 'monthly' && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 flex justify-between">
              <span className="text-[10px] text-primary">Setara per bulan</span>
              <span className="text-xs font-bold text-primary">
                {formatShortCurrency(monthlyEquivalent(parseFloat(amount), cycle))}/bln
              </span>
            </div>
          )}

          {/* Tanggal tagihan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Tanggal Tagihan</label>
              <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2.5 focus-within:border-primary/50">
                <span className="text-text-muted text-xs">Tgl</span>
                <input type="number" value={billingDay} onChange={(e) => setBillingDay(e.target.value)}
                  min="1" max="31" placeholder="1"
                  className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1.5">Akun Bayar</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="input text-sm [color-scheme:dark]">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan */}
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)" maxLength={60} className="input" />

          {/* Status aktif */}
          <div className="flex items-center justify-between p-3 bg-elevated rounded-xl border border-border">
            <div>
              <p className="text-sm font-semibold text-text-primary">Status Aktif</p>
              <p className="text-[10px] text-text-muted">Nonaktifkan untuk langganan yang dijeda</p>
            </div>
            <button onClick={() => setActive(!active)}
              className={clsx('w-11 h-6 rounded-full transition-all relative', active ? 'bg-primary' : 'bg-border')}>
              <div className={clsx(
                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
                active ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
              )} />
            </button>
          </div>

          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan</button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Card ────────────────────────────────────────────
function SubCard({ sub, onEdit, onDelete, mobile }) {
  const { accounts } = useFinance();
  const cat  = SUB_CATEGORIES.find(c => c.id === sub.categoryId) || SUB_CATEGORIES.at(-1);
  const acc  = accounts.find(a => a.id === sub.accountId);
  const days = daysUntilNext(sub.billingDay, sub.cycle);
  const isUrgent   = days <= 3;
  const isUpcoming = days <= 7 && days > 3;
  const cycleLabel = BILLING_CYCLES.find(b => b.id === sub.cycle)?.label || 'Bulanan';
  const monthly    = monthlyEquivalent(sub.amount, sub.cycle);

  return (
    <div className={clsx(
      'bg-card border border-border rounded-xl p-3 space-y-2',
      !sub.active && 'opacity-60',
      isUrgent && sub.active && 'border-expense/40'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xl"
          style={{ backgroundColor: cat.color + '22' }}>
          {sub.photo
            ? <img src={sub.photo} alt={sub.name} className="w-full h-full object-cover" />
            : cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-text-primary truncate">{sub.name}</p>
            {!sub.active && (
              <span className="text-[10px] bg-elevated text-text-muted px-1.5 py-0.5 rounded-full shrink-0">Jeda</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted">{cat.label} · {cycleLabel}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(sub)} className="p-1 rounded-lg hover:bg-elevated text-text-muted">
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(sub.id)} className="p-1 rounded-lg hover:bg-expense/10 text-expense/50 hover:text-expense">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Amount + billing info */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold" style={{ color: sub.active ? cat.color : '#5A5A5A' }}>
            {mobile ? formatShortCurrency(sub.amount) : formatCurrency(sub.amount)}
            <span className="text-[10px] text-text-muted font-normal ml-1">/{cycleLabel.toLowerCase()}</span>
          </p>
          {sub.cycle !== 'monthly' && (
            <p className="text-[10px] text-text-muted">
              ≈ {formatShortCurrency(monthly)}/bln
            </p>
          )}
        </div>
        {sub.active && (
          <div className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium',
            isUrgent ? 'bg-expense/15 text-expense' : isUpcoming ? 'bg-secondary/15 text-secondary' : 'bg-elevated text-text-muted'
          )}>
            {isUrgent && <AlertTriangle size={9} />}
            <Calendar size={9} />
            {days === 0 ? 'Hari ini' : days === 1 ? 'Besok' : `${days} hari`}
          </div>
        )}
      </div>

      {/* Account + note */}
      <div className="flex items-center gap-2">
        {acc && (
          <span className="text-[10px] text-text-muted">
            via {acc.name}
          </span>
        )}
        {sub.note && (
          <span className="text-[10px] text-text-muted truncate">· {sub.note}</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function Subscriptions() {
  const mobile = useIsMobile();
  const { subscriptions = [], addSubscription, updateSubscription, deleteSubscription } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [filter,    setFilter]    = useState('all'); // all | active | paused

  const filtered = useMemo(() => subscriptions.filter(s => {
    if (filter === 'active') return s.active !== false;
    if (filter === 'paused') return s.active === false;
    return true;
  }), [subscriptions, filter]);

  // Urutkan: urgent dulu, lalu alphabetical
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (!a.active && b.active) return 1;
    if (a.active && !b.active) return -1;
    const dA = daysUntilNext(a.billingDay, a.cycle);
    const dB = daysUntilNext(b.billingDay, b.cycle);
    return dA - dB;
  }), [filtered]);

  // Total per bulan
  const totalMonthly = useMemo(() =>
    subscriptions
      .filter(s => s.active !== false)
      .reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.cycle), 0),
    [subscriptions]
  );

  const urgentCount = useMemo(() =>
    subscriptions.filter(s => s.active !== false && daysUntilNext(s.billingDay, s.cycle) <= 3).length,
    [subscriptions]
  );

  const handleEdit   = (item) => { setEditItem(item); setShowModal(true); };
  const handleDelete = (id)   => { if (window.confirm('Hapus langganan ini?')) deleteSubscription(id); };
  const handleSave   = (data) => {
    if (data.id) updateSubscription(data);
    else addSubscription(data);
  };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-3xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>
          Langganan
        </p>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Tambah
        </button>
      </div>

      {/* Summary */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-xl p-2 text-center">
            <p className="text-[10px] text-text-muted mb-0.5">Total/Bulan</p>
            <p className="text-xs font-bold text-expense">{formatShortCurrency(totalMonthly)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2 text-center">
            <p className="text-[10px] text-text-muted mb-0.5">Aktif</p>
            <p className="text-xs font-bold text-income">
              {subscriptions.filter(s => s.active !== false).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2 text-center">
            <p className="text-[10px] text-text-muted mb-0.5">Tagihan Dekat</p>
            <p className={clsx('text-xs font-bold', urgentCount > 0 ? 'text-expense' : 'text-text-secondary')}>
              {urgentCount > 0 ? `${urgentCount} item` : 'Aman'}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      {subscriptions.length > 0 && (
        <div className="flex gap-1.5">
          {[
            { id: 'all',    label: 'Semua'   },
            { id: 'active', label: 'Aktif'   },
            { id: 'paused', label: 'Dijeda'  },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                filter === f.id ? 'bg-primary text-bg border-primary' : 'border-border text-text-secondary'
              )}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {sorted.length === 0
        ? <EmptyState
            icon="📡"
            title={subscriptions.length === 0 ? 'Belum ada langganan' : 'Tidak ada'}
            subtitle={subscriptions.length === 0 ? 'Tap Tambah untuk mencatat langganan rutin' : ''}
          />
        : <div className={clsx('grid gap-2', mobile ? 'grid-cols-1' : 'grid-cols-2')}>
            {sorted.map(s => (
              <SubCard key={s.id} sub={s} mobile={mobile}
                onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
      }

      {showModal && (
        <SubModal
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
          existing={editItem}
        />
      )}
    </div>
  );
}
