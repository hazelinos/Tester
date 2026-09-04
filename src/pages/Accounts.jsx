import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Camera, Smile } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import clsx from 'clsx';

const ACCOUNT_ICONS  = ['💵', '🏦', '📱', '💳', '🏧', '💰', '🪙', '💎', '🎯', '📊'];
const ACCOUNT_COLORS = ['#A8E6CF','#69B4FF','#C469FF','#FF8C69','#FFD369','#FF6B9D','#69FFD3','#FF6B6B','#6BCFFF','#FFB347'];

// ─── Komponen tampilan ikon akun (emoji atau foto) ───────────────
export function AccountIcon({ account, size = 'md' }) {
  const sizeClass = size === 'lg'
    ? 'w-14 h-14 rounded-2xl text-3xl'
    : size === 'sm'
      ? 'w-8 h-8 rounded-xl text-base'
      : 'w-10 h-10 rounded-xl text-xl';

  return (
    <div
      className={clsx('flex items-center justify-center shrink-0 overflow-hidden', sizeClass)}
      style={{ backgroundColor: account.iconType === 'photo' ? 'transparent' : account.color + '22' }}
    >
      {account.iconType === 'photo' && account.iconPhoto ? (
        <img src={account.iconPhoto} alt={account.name} className="w-full h-full object-cover" />
      ) : (
        <span>{account.icon}</span>
      )}
    </div>
  );
}

// ─── Account Modal ───────────────────────────────────────────────
function AccountModal({ onClose, onSave, existing }) {
  const [name,      setName]      = useState(existing?.name      || '');
  const [icon,      setIcon]      = useState(existing?.icon      || '💵');
  const [iconType,  setIconType]  = useState(existing?.iconType  || 'emoji'); // 'emoji' | 'photo'
  const [iconPhoto, setIconPhoto] = useState(existing?.iconPhoto || null);
  const [color,     setColor]     = useState(existing?.color     || ACCOUNT_COLORS[0]);
  const [balance,   setBalance]   = useState(existing?.balance != null ? String(existing.balance) : '0');

  const fileRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setIconPhoto(ev.target.result);
      setIconType('photo');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Masukkan nama akun');
    onSave({
      ...(existing || {}),
      name:      name.trim(),
      icon,
      iconType,
      iconPhoto: iconType === 'photo' ? iconPhoto : null,
      color,
      balance:   parseFloat(balance) || 0,
    });
    onClose();
  };

  // Preview ikon saat ini
  const previewIcon = iconType === 'photo' && iconPhoto ? (
    <img src={iconPhoto} alt="preview" className="w-full h-full object-cover" />
  ) : (
    <span className="text-4xl">{icon}</span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg text-text-primary">
            {existing ? 'Edit Akun' : 'Tambah Akun'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-elevated text-text-muted transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl border"
            style={{ borderColor: color + '55', backgroundColor: color + '11' }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconType === 'photo' ? '#2A2A2A' : color + '22' }}>
              {previewIcon}
            </div>
            <div>
              <p className="font-bold text-base" style={{ color }}>{name || 'Nama Akun'}</p>
              <p className="text-sm text-text-secondary">{formatCurrency(parseFloat(balance) || 0)}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Nama Akun</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: BCA, Dana, Dompet"
              maxLength={20}
              className="input"
            />
          </div>

          {/* Balance */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Saldo</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted">Rp</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-text-primary focus:outline-none"
              />
            </div>
          </div>

          {/* ── Ikon: tab Emoji / Foto ─────────────── */}
          <div>
            <label className="text-xs text-text-muted block mb-2">Ikon Akun</label>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-bg rounded-xl p-1 mb-3 w-fit">
              <button
                onClick={() => setIconType('emoji')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  iconType === 'emoji'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Smile size={13} /> Emoji
              </button>
              <button
                onClick={() => setIconType('photo')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  iconType === 'photo'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Camera size={13} /> Foto
              </button>
            </div>

            {/* Emoji grid */}
            {iconType === 'emoji' && (
              <div className="flex gap-2 flex-wrap">
                {ACCOUNT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={clsx(
                      'w-10 h-10 rounded-xl border text-xl flex items-center justify-center transition-all',
                      icon === ic ? 'border-current' : 'border-border bg-input hover:bg-elevated'
                    )}
                    style={icon === ic ? { borderColor: color, backgroundColor: color + '22' } : {}}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            )}

            {/* Photo upload */}
            {iconType === 'photo' && (
              <div className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {iconPhoto ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border shrink-0">
                      <img src={iconPhoto} alt="ikon" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <Camera size={12} /> Ganti Foto
                      </button>
                      <button
                        onClick={() => { setIconPhoto(null); setIconType('emoji'); }}
                        className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Camera size={24} className="text-text-muted" />
                    <span className="text-sm text-text-muted">Klik untuk upload foto</span>
                    <span className="text-xs text-text-muted">JPG, PNG, max 2MB</span>
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
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? '3px solid white' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {color === c && <span className="text-xs text-black font-bold">✓</span>}
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

// ─── Account Card ────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete }) {
  return (
    <div className="card flex items-center gap-4">
      {/* Ikon: emoji atau foto */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden"
        style={{ backgroundColor: account.iconType === 'photo' ? '#2A2A2A' : account.color + '22' }}
      >
        {account.iconType === 'photo' && account.iconPhoto ? (
          <img src={account.iconPhoto} alt={account.name} className="w-full h-full object-cover" />
        ) : (
          <span>{account.icon}</span>
        )}
      </div>

      <div className="flex-1">
        <p className="font-semibold text-text-primary">{account.name}</p>
        <p className={clsx('text-lg font-bold mt-0.5', account.balance >= 0 ? 'text-income' : 'text-expense')}>
          {formatCurrency(account.balance)}
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(account)}
          className="p-2 rounded-xl hover:bg-elevated text-text-muted hover:text-text-secondary transition-colors border border-border">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(account.id)}
          className="p-2 rounded-xl hover:bg-expense/10 text-expense/50 hover:text-expense transition-colors border border-border">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function Accounts() {
  const [showModal,   setShowModal]   = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const { accounts, addAccount, updateAccount, deleteAccount, getTotalBalance } = useFinance();

  const totalBalance = getTotalBalance();

  const handleSave = (data) => {
    if (data.id) updateAccount(data);
    else addAccount(data);
  };

  const handleEdit   = (acc) => { setEditAccount(acc); setShowModal(true); };
  const handleDelete = (id)  => {
    if (accounts.length <= 1) return alert('Kamu harus memiliki minimal 1 akun');
    if (window.confirm('Hapus akun ini? Riwayat transaksi tidak ikut terhapus.')) deleteAccount(id);
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Akun</h1>
        <button
          onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={15} /> Tambah Akun
        </button>
      </div>

      {/* Total balance */}
      <div className="card text-center py-6 space-y-1">
        <p className="text-xs text-text-muted">Total Semua Akun</p>
        <p className={clsx('text-4xl font-extrabold', totalBalance >= 0 ? 'text-income' : 'text-expense')}>
          {formatCurrency(totalBalance)}
        </p>
        <p className="text-xs text-text-secondary">{accounts.length} akun aktif</p>
      </div>

      {/* Accounts */}
      {accounts.length === 0 ? (
        <EmptyState icon="🏦" title="Belum ada akun" subtitle="Klik Tambah Akun untuk memulai" />
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <AccountModal
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={handleSave}
          existing={editAccount}
        />
      )}
    </div>
  );
}
