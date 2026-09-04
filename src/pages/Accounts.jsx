import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Camera, Smile } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency } from '../utils/formatters';
import clsx from 'clsx';

const ACCOUNT_ICONS  = ['💵','🏦','📱','💳','🏧','💰','🪙','💎','🎯','📊'];
const ACCOUNT_COLORS = ['#A8E6CF','#69B4FF','#C469FF','#FF8C69','#FFD369','#FF6B9D','#69FFD3','#FF6B6B','#6BCFFF','#FFB347'];

function AccountModal({ onClose, onSave, existing }) {
  const [name,      setName]      = useState(existing?.name      || '');
  const [icon,      setIcon]      = useState(existing?.icon      || '💵');
  const [iconType,  setIconType]  = useState(existing?.iconType  || 'emoji');
  const [iconPhoto, setIconPhoto] = useState(existing?.iconPhoto || null);
  const [color,     setColor]     = useState(existing?.color     || ACCOUNT_COLORS[0]);
  const [balance,   setBalance]   = useState(existing?.balance != null ? String(existing.balance) : '0');
  const fileRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { alert('Max 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setIconPhoto(ev.target.result); setIconType('photo'); };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama akun');
    onSave({ ...(existing||{}), name: name.trim(), icon, iconType, iconPhoto: iconType==='photo'?iconPhoto:null, color, balance: parseFloat(balance)||0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{existing?'Edit Akun':'Tambah Akun'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: color+'55', backgroundColor: color+'11' }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconType==='photo'?'#2A2A2A':color+'22' }}>
              {iconType==='photo'&&iconPhoto
                ? <img src={iconPhoto} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl">{icon}</span>}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color }}>{name||'Nama Akun'}</p>
              <p className="text-xs text-text-secondary">{formatCurrency(parseFloat(balance)||0)}</p>
            </div>
          </div>
          {/* Name */}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nama akun (BCA, Dana, Kas...)" maxLength={20} className="input" />
          {/* Balance */}
          <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
            <span className="text-text-muted text-sm">Rp</span>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)}
              className="flex-1 bg-transparent text-lg font-bold text-text-primary focus:outline-none" />
          </div>
          {/* Icon tab */}
          <div>
            <div className="flex gap-1 bg-bg rounded-xl p-1 mb-3 w-fit">
              {[{id:'emoji',icon:<Smile size={12}/>,label:'Emoji'},{id:'photo',icon:<Camera size={12}/>,label:'Foto'}].map((t) => (
                <button key={t.id} onClick={() => setIconType(t.id)}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    iconType===t.id?'bg-card text-text-primary':'text-text-muted')}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {iconType==='emoji' ? (
              <div className="flex gap-1.5 flex-wrap">
                {ACCOUNT_ICONS.map((ic) => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className={clsx('w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-all',
                      icon===ic?'border-current':'border-border bg-input')}
                    style={icon===ic?{borderColor:color,backgroundColor:color+'22'}:{}}>
                    {ic}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                {iconPhoto ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-border">
                      <img src={iconPhoto} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1.5">
                      <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"><Camera size={11} /> Ganti</button>
                      <button onClick={() => { setIconPhoto(null); setIconType('emoji'); }} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"><Trash2 size={11} /> Hapus</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-1.5 hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Camera size={20} className="text-text-muted" />
                    <span className="text-xs text-text-muted">Upload foto</span>
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Color */}
          <div>
            <label className="text-xs text-text-muted block mb-2">Warna Aksen</label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: c, outline: color===c?'3px solid white':'none', outlineOffset: 2 }}>
                  {color===c && <span className="text-[10px] text-black font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full py-3">Simpan Akun</button>
        </div>
      </div>
    </div>
  );
}

export default function Accounts() {
  const mobile = useIsMobile();
  const [showModal,   setShowModal]   = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const { accounts, addAccount, updateAccount, deleteAccount, getTotalBalance } = useFinance();

  const totalBalance = getTotalBalance();
  const handleSave   = (data) => { if (data.id) updateAccount(data); else addAccount(data); };
  const handleEdit   = (acc)  => { setEditAccount(acc); setShowModal(true); };
  const handleDelete = (id)   => {
    if (accounts.length <= 1) return alert('Minimal 1 akun');
    if (window.confirm('Hapus akun ini?')) deleteAccount(id);
  };

  const padding = mobile ? 'px-3 pb-20' : 'p-6 max-w-2xl mx-auto';

  return (
    <div className={clsx('space-y-3 pt-3', padding)}>
      <div className="flex items-center justify-between">
        <p className={clsx('font-bold text-text-primary', mobile?'text-base':'text-2xl')}>Akun</p>
        <button onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Tambah
        </button>
      </div>

      {/* Total */}
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-text-muted mb-1">Total Semua Akun</p>
        <p className={clsx('font-extrabold', mobile?'text-2xl':'text-4xl', totalBalance>=0?'text-income':'text-expense')}>
          {mobile ? formatShortCurrency(totalBalance) : formatCurrency(totalBalance)}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">{accounts.length} akun aktif</p>
      </div>

      {/* List */}
      {accounts.length === 0
        ? <EmptyState icon="🏦" title="Belum ada akun" subtitle="Tap Tambah untuk mulai" />
        : <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 text-2xl"
                  style={{ backgroundColor: acc.iconType==='photo'?'#2A2A2A':acc.color+'22' }}>
                  {acc.iconType==='photo'&&acc.iconPhoto
                    ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                    : <span>{acc.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{acc.name}</p>
                  <p className={clsx('font-bold', mobile?'text-base':'text-lg', acc.balance>=0?'text-income':'text-expense')}>
                    {mobile ? formatShortCurrency(acc.balance) : formatCurrency(acc.balance)}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleEdit(acc)}
                    className="p-2 rounded-xl hover:bg-elevated text-text-muted border border-border transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)}
                    className="p-2 rounded-xl hover:bg-expense/10 text-expense/50 hover:text-expense border border-border transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
      }

      {showModal && (
        <AccountModal onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={handleSave} existing={editAccount} />
      )}
    </div>
  );
}
