import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Camera, Smile, Wallet, Bell } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatShortCurrency, generateId } from '../utils/formatters';
import clsx from 'clsx';

const ACCOUNT_ICONS  = ['💵','🏦','📱','💳','🏧','💰','🪙','💎','🎯','📊'];
const ACCOUNT_COLORS = ['#A8E6CF','#69B4FF','#C469FF','#FF8C69','#FFD369','#FF6B9D','#69FFD3','#FF6B6B','#6BCFFF','#FFB347'];
const INCOME_CATS    = ['salary','freelance','business','investment','gift','other_income'];

// ─── Cek apakah gaji sudah dicatat bulan ini ─────────────────────
const isSameMonthNow = (dateStr) => {
  const d = new Date(dateStr);
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
};

// ─── Salary Reminder Popup ────────────────────────────────────────
export function SalaryReminderPopup() {
  const { accounts, transactions, addTransaction } = useFinance();
  const [pending, setPending] = useState([]);
  const [current, setCurrent] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const today = new Date().getDate();
    const due = accounts.filter((acc) => {
      if (!acc.salaryEnabled || !acc.salaryAmount || !acc.salaryDate) return false;
      if (today < acc.salaryDate) return false;
      // Cek apakah sudah ada pemasukan bulan ini dari akun ini
      const alreadyAdded = transactions.some(
        (t) => t.type === 'income' && t.accountId === acc.id &&
               t.categoryId === 'salary' && isSameMonthNow(t.date)
      );
      return !alreadyAdded;
    });
    if (due.length > 0) {
      setPending(due);
      setCurrent(due[0]);
    }
  }, [accounts, transactions, dismissed]);

  if (!current || dismissed) return null;

  const handleAdd = () => {
    addTransaction({
      type:       'income',
      amount:     current.salaryAmount,
      categoryId: 'salary',
      accountId:  current.id,
      note:       `Gaji ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
      date:       new Date().toISOString(),
    });
    const rest = pending.filter(a => a.id !== current.id);
    if (rest.length > 0) {
      setPending(rest);
      setCurrent(rest[0]);
    } else {
      setCurrent(null);
    }
  };

  const handleSkip = () => {
    const rest = pending.filter(a => a.id !== current.id);
    if (rest.length > 0) {
      setPending(rest);
      setCurrent(rest[0]);
    } else {
      setCurrent(null);
      setDismissed(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 modal-overlay">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-sm">
        <div className="p-5 space-y-4">
          {/* Icon + judul */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-income/20 flex items-center justify-center shrink-0">
              <Bell size={22} className="text-income" />
            </div>
            <div>
              <p className="font-bold text-text-primary">Gaji Masuk?</p>
              <p className="text-xs text-text-muted mt-0.5">
                Sudah tanggal {current.salaryDate}, saatnya catat gaji di akun{' '}
                <span className="font-semibold text-text-secondary">{current.name}</span>
              </p>
            </div>
          </div>

          {/* Detail */}
          <div className="bg-bg border border-border rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Akun</span>
              <span className="text-xs font-semibold text-text-primary">{current.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Jumlah Gaji</span>
              <span className="text-xs font-bold text-income">{formatCurrency(current.salaryAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-muted">Tanggal Gajian</span>
              <span className="text-xs text-text-secondary">Setiap tgl {current.salaryDate}</span>
            </div>
          </div>

          {pending.length > 1 && (
            <p className="text-xs text-text-muted text-center">
              +{pending.length - 1} akun lain menunggu
            </p>
          )}

          {/* Tombol */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleSkip}
              className="btn-ghost py-2.5 text-sm">
              Nanti Saja
            </button>
            <button onClick={handleAdd}
              className="btn-primary py-2.5 text-sm flex items-center justify-center gap-1.5">
              <Wallet size={14} /> Catat Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Account Modal ────────────────────────────────────────────────
function AccountModal({ onClose, onSave, existing }) {
  const [name,          setName]          = useState(existing?.name          || '');
  const [icon,          setIcon]          = useState(existing?.icon          || '💵');
  const [iconType,      setIconType]      = useState(existing?.iconType      || 'emoji');
  const [iconPhoto,     setIconPhoto]     = useState(existing?.iconPhoto     || null);
  const [color,         setColor]         = useState(existing?.color         || ACCOUNT_COLORS[0]);
  const [balance,       setBalance]       = useState(existing?.balance != null ? String(existing.balance) : '0');
  const [salaryEnabled, setSalaryEnabled] = useState(existing?.salaryEnabled || false);
  const [salaryAmount,  setSalaryAmount]  = useState(existing?.salaryAmount  ? String(existing.salaryAmount) : '');
  const [salaryDate,    setSalaryDate]    = useState(existing?.salaryDate    ? String(existing.salaryDate) : '25');
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
    if (salaryEnabled && (!salaryAmount || parseFloat(salaryAmount) <= 0))
      return alert('Masukkan jumlah gaji');
    onSave({
      ...(existing || {}),
      name: name.trim(), icon, iconType,
      iconPhoto:     iconType === 'photo' ? iconPhoto : null,
      color,
      balance:       parseFloat(balance)      || 0,
      salaryEnabled,
      salaryAmount:  salaryEnabled ? parseFloat(salaryAmount) || 0 : 0,
      salaryDate:    salaryEnabled ? parseInt(salaryDate) || 25    : 25,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-overlay bg-black/60">
      <div className="modal-sheet bg-card border border-border rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base text-text-primary">{existing ? 'Edit Akun' : 'Tambah Akun'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-elevated text-text-muted">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: color + '55', backgroundColor: color + '11' }}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconType === 'photo' ? '#2A2A2A' : color + '22' }}>
              {iconType === 'photo' && iconPhoto
                ? <img src={iconPhoto} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl">{icon}</span>}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color }}>{name || 'Nama Akun'}</p>
              <p className="text-xs text-text-secondary">{formatCurrency(parseFloat(balance) || 0)}</p>
              {salaryEnabled && salaryAmount && (
                <p className="text-[10px] text-income mt-0.5">
                  Gaji {formatShortCurrency(parseFloat(salaryAmount))} tgl {salaryDate}
                </p>
              )}
            </div>
          </div>

          {/* Name */}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nama akun (BCA, Dana, Kas...)" maxLength={20} className="input" />

          {/* Balance */}
          <div>
            <label className="text-xs text-text-muted block mb-1.5">Saldo</label>
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-4 py-3 focus-within:border-primary/50">
              <span className="text-text-muted text-sm">Rp</span>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold text-text-primary focus:outline-none" />
            </div>
          </div>

          {/* ── Gaji Otomatis ─────────────────────── */}
          <div className="bg-elevated rounded-xl p-3 space-y-3 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Gaji Otomatis</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Ingatkan untuk catat gaji setiap bulan
                </p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => setSalaryEnabled(!salaryEnabled)}
                className={clsx(
                  'w-11 h-6 rounded-full transition-all relative shrink-0',
                  salaryEnabled ? 'bg-primary' : 'bg-border'
                )}
              >
                <div className={clsx(
                  'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm',
                  salaryEnabled ? 'left-5.5 left-[calc(100%-1.375rem)]' : 'left-0.5'
                )} />
              </button>
            </div>

            {salaryEnabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Jumlah Gaji</label>
                  <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50">
                    <span className="text-text-muted text-[10px]">Rp</span>
                    <input type="number" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted block mb-1">Tanggal Gajian</label>
                  <div className="flex items-center gap-1 bg-input border border-border rounded-xl px-3 py-2 focus-within:border-primary/50">
                    <span className="text-text-muted text-[10px]">Tgl</span>
                    <input type="number" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)}
                      placeholder="25" min="1" max="31"
                      className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Icon tab */}
          <div>
            <div className="flex gap-1 bg-bg rounded-xl p-1 mb-3 w-fit">
              {[
                { id: 'emoji', icon: <Smile size={12} />, label: 'Emoji' },
                { id: 'photo', icon: <Camera size={12} />, label: 'Foto'  },
              ].map((t) => (
                <button key={t.id} onClick={() => setIconType(t.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    iconType === t.id ? 'bg-card text-text-primary' : 'text-text-muted'
                  )}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {iconType === 'emoji' ? (
              <div className="flex gap-1.5 flex-wrap">
                {ACCOUNT_ICONS.map((ic) => (
                  <button key={ic} onClick={() => setIcon(ic)}
                    className={clsx(
                      'w-9 h-9 rounded-xl border text-lg flex items-center justify-center transition-all',
                      icon === ic ? 'border-current' : 'border-border bg-input'
                    )}
                    style={icon === ic ? { borderColor: color, backgroundColor: color + '22' } : {}}>
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
                      <button onClick={() => fileRef.current?.click()}
                        className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
                        <Camera size={11} /> Ganti
                      </button>
                      <button onClick={() => { setIconPhoto(null); setIconType('emoji'); }}
                        className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                        <Trash2 size={11} /> Hapus
                      </button>
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
                  style={{ backgroundColor: c, outline: color === c ? '3px solid white' : 'none', outlineOffset: 2 }}>
                  {color === c && <span className="text-[10px] text-black font-bold">✓</span>}
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

// ─── Page ─────────────────────────────────────────────────────────
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
        <p className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>Akun</p>
        <button onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
          <Plus size={13} /> Tambah
        </button>
      </div>

      {/* Total */}
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-text-muted mb-1">Total Semua Akun</p>
        <p className={clsx('font-extrabold', mobile ? 'text-2xl' : 'text-4xl', totalBalance >= 0 ? 'text-income' : 'text-expense')}>
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
                  style={{ backgroundColor: acc.iconType === 'photo' ? '#2A2A2A' : acc.color + '22' }}>
                  {acc.iconType === 'photo' && acc.iconPhoto
                    ? <img src={acc.iconPhoto} alt={acc.name} className="w-full h-full object-cover" />
                    : <span>{acc.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{acc.name}</p>
                  <p className={clsx('font-bold', mobile ? 'text-base' : 'text-lg', acc.balance >= 0 ? 'text-income' : 'text-expense')}>
                    {mobile ? formatShortCurrency(acc.balance) : formatCurrency(acc.balance)}
                  </p>
                  {acc.salaryEnabled && acc.salaryAmount > 0 && (
                    <p className="text-[10px] text-income/80 mt-0.5">
                      Gaji {formatShortCurrency(acc.salaryAmount)} · tgl {acc.salaryDate}
                    </p>
                  )}
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
        <AccountModal
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSave={handleSave}
          existing={editAccount}
        />
      )}
    </div>
  );
}
