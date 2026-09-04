import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, User, Trash2, Check, RotateCcw, LogOut } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import clsx from 'clsx';

// ─── Google Login Button ─────────────────────────────────────────
function GoogleLoginButton({ onLogin }) {
  const btnRef = useRef(null);
  const { ready, isConfigured, signIn } = useGoogleAuth(onLogin);

  useEffect(() => {
    if (ready && btnRef.current) signIn(btnRef.current);
  }, [ready]);

  if (!isConfigured) {
    return (
      <div className="bg-elevated border border-border rounded-xl p-3 text-xs text-text-muted space-y-1">
        <p className="font-semibold text-text-secondary">Google Login belum dikonfigurasi</p>
        <p>Tambahkan <code className="bg-bg px-1 py-0.5 rounded text-primary">VITE_GOOGLE_CLIENT_ID</code> di Vercel Environment Variables.</p>
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
          className="text-primary underline underline-offset-2">Buat di Google Console →</a>
      </div>
    );
  }

  return (
    <div>
      <div ref={btnRef} />
      {!ready && <p className="text-xs text-text-muted mt-1">Memuat Google Sign-In...</p>}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function Settings() {
  const mobile = useIsMobile();
  const { settings, updateSettings, loginWithGoogle, logoutGoogle } = useSettings();
  const { transactions, accounts, budgets, savings, debts }         = useFinance();

  const [name,     setName]     = useState(settings.name);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [avatar,   setAvatar]   = useState(settings.avatar);
  const [saved,    setSaved]    = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setName(settings.name);
    setAvatar(settings.avatar);
  }, [settings.googleUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings({
      name:     name.trim()     || 'Pengguna',
      subtitle: subtitle.trim() || 'Semangat kelola keuanganmu! 👋',
      avatar,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGoogleLogin = useCallback((user) => {
    loginWithGoogle(user);
    setName(user.name);
    setAvatar(user.picture);
  }, [loginWithGoogle]);

  const hasChanges =
    name !== settings.name ||
    subtitle !== settings.subtitle ||
    avatar !== settings.avatar;

  const padding = mobile ? 'px-3 pb-24' : 'p-6 max-w-xl mx-auto';

  return (
    <div className={clsx('space-y-4 pt-3', padding)}>
      {!mobile && (
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pengaturan</h1>
          <p className="text-text-muted text-sm mt-0.5">Kelola profil dan preferensi</p>
        </div>
      )}
      {mobile && <p className="text-base font-bold text-text-primary">Pengaturan</p>}

      {/* ── Google Login ─────────────────────────── */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Akun Google</h2>
        {settings.googleUser ? (
          <div className="flex items-center gap-3">
            <img src={settings.googleUser.picture} alt="google"
              className="w-10 h-10 rounded-full border border-border" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{settings.googleUser.name}</p>
              <p className="text-xs text-text-muted truncate">{settings.googleUser.email}</p>
            </div>
            <button onClick={logoutGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-elevated border border-border text-xs text-text-secondary hover:text-expense transition-colors">
              <LogOut size={12} /> Keluar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">
              Login dengan Google untuk mengisi nama dan foto profil secara otomatis.
              Data tetap tersimpan lokal di perangkat ini.
            </p>
            <GoogleLoginButton onLogin={handleGoogleLogin} />
          </div>
        )}
      </div>

      {/* ── Profil ───────────────────────────────── */}
      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-text-primary">Profil</h2>

        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border bg-elevated flex items-center justify-center">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={28} className="text-text-muted" />}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Camera size={11} className="text-bg" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-text-secondary">Foto profil di header & sidebar</p>
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1">
                <Camera size={11} /> Ganti
              </button>
              {avatar && (
                <button onClick={() => { setAvatar(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="btn-danger text-xs px-2.5 py-1.5 flex items-center gap-1">
                  <Trash2 size={11} /> Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1.5">Nama</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu" maxLength={30} className="input" />
        </div>

        <div>
          <label className="text-xs text-text-muted block mb-1.5">Subtitle Dashboard</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Semangat kelola keuanganmu! 👋" maxLength={60} className="input" />
        </div>

        <div className="bg-bg rounded-xl p-3 border border-border">
          <p className="text-[10px] text-text-muted mb-1.5">Preview</p>
          <p className="text-base font-bold text-text-primary">Halo, {name || 'Pengguna'} 👋</p>
          <p className="text-xs text-text-muted">{subtitle || 'Semangat kelola keuanganmu! 👋'}</p>
        </div>

        {/* Save — inline, tidak sticky */}
        <button
          onClick={handleSave}
          disabled={!hasChanges && !saved}
          className={clsx(
            'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
            saved
              ? 'bg-income/20 text-income border border-income/30'
              : hasChanges
                ? 'bg-primary text-bg hover:bg-primary-dark'
                : 'bg-elevated text-text-muted cursor-not-allowed'
          )}>
          {saved ? <><Check size={15} /> Tersimpan!</> : 'Simpan Perubahan'}
        </button>
      </div>

      {/* ── Statistik ────────────────────────────── */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Statistik Data</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Transaksi', val: transactions.length, icon: '📋' },
            { label: 'Akun',      val: accounts.length,     icon: '🏦' },
            { label: 'Budget',    val: budgets.length,       icon: '🎯' },
            { label: 'Tabungan',  val: savings?.length  || 0, icon: '🐷' },
            { label: 'Hutang',    val: debts?.length    || 0, icon: '💸' },
          ].map((s) => (
            <div key={s.label} className="bg-bg rounded-xl p-2.5 text-center border border-border">
              <p className="text-xl mb-0.5">{s.icon}</p>
              <p className="text-base font-bold text-text-primary">{s.val}</p>
              <p className="text-[10px] text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────── */}
      <div className="card space-y-3 border-expense/20">
        <h2 className="text-sm font-bold text-expense">Zona Berbahaya</h2>
        <p className="text-xs text-text-muted">Tidak bisa dibatalkan setelah dikonfirmasi.</p>
        <button
          onClick={() => {
            if (window.confirm('Reset semua data? Semua transaksi, akun, budget, tabungan, dan hutang akan dihapus permanen.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="btn-danger flex items-center gap-2 text-sm">
          <RotateCcw size={14} /> Reset Semua Data
        </button>
      </div>
    </div>
  );
}
