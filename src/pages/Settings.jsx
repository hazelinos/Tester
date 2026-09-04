import { useState, useRef } from 'react';
import { Camera, User, Trash2, Check, RotateCcw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';
import clsx from 'clsx';

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { transactions, accounts, budgets } = useFinance();

  const [name,     setName]     = useState(settings.name);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [avatar,   setAvatar]   = useState(settings.avatar);
  const [saved,    setSaved]    = useState(false);

  const fileInputRef = useRef(null);

  // Handle avatar upload — convert to base64
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const hasChanges =
    name !== settings.name ||
    subtitle !== settings.subtitle ||
    avatar !== settings.avatar;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Pengaturan</h1>
        <p className="text-text-muted text-sm mt-0.5">Kelola profil dan preferensi aplikasi</p>
      </div>

      {/* ── Profil ───────────────────────────────── */}
      <div className="card space-y-5">
        <h2 className="text-sm font-bold text-text-primary">Profil</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border bg-elevated flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-text-muted" />
              )}
            </div>
            {/* Camera overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
            >
              <Camera size={13} className="text-bg" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm text-text-secondary">
              Upload foto profil kamu. Akan muncul di sidebar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Camera size={12} /> Pilih Foto
              </button>
              {avatar && (
                <button
                  onClick={removeAvatar}
                  className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Trash2 size={12} /> Hapus
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-text-muted block mb-1.5">Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            maxLength={30}
            className="input"
          />
          <p className="text-xs text-text-muted mt-1">
            Akan muncul sebagai sapaan di Dashboard
          </p>
        </div>

        {/* Subtitle */}
        <div>
          <label className="text-xs text-text-muted block mb-1.5">Subtitle Dashboard</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Semangat kelola keuanganmu! 👋"
            maxLength={60}
            className="input"
          />
          <p className="text-xs text-text-muted mt-1">
            Teks kecil di bawah nama halaman Dashboard
          </p>
        </div>

        {/* Preview */}
        <div className="bg-bg rounded-xl p-4 border border-border space-y-1">
          <p className="text-xs text-text-muted mb-2">Preview Dashboard</p>
          <p className="text-xl font-bold text-text-primary">
            Halo, {name || 'Pengguna'} 👋
          </p>
          <p className="text-sm text-text-muted">
            {subtitle || 'Semangat kelola keuanganmu! 👋'}
          </p>
        </div>
      </div>

      {/* ── Statistik ────────────────────────────── */}
      <div className="card space-y-3">
        <h2 className="text-sm font-bold text-text-primary">Statistik Data</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Transaksi', val: transactions.length, icon: '📋' },
            { label: 'Akun',      val: accounts.length,     icon: '🏦' },
            { label: 'Budget',    val: budgets.length,       icon: '🎯' },
          ].map((s) => (
            <div key={s.label} className="bg-bg rounded-xl p-3 text-center border border-border">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-lg font-bold text-text-primary">{s.val}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ──────────────────────────── */}
      <div className="card space-y-3 border-expense/20">
        <h2 className="text-sm font-bold text-expense">Zona Berbahaya</h2>
        <p className="text-xs text-text-muted">
          Tindakan di bawah ini tidak bisa dibatalkan. Pastikan kamu sudah yakin sebelum melanjutkan.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset semua data? Semua transaksi, akun, dan budget akan dihapus permanen.')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="btn-danger flex items-center gap-2 text-sm"
        >
          <RotateCcw size={14} /> Reset Semua Data
        </button>
      </div>

      {/* ── Save button ───────────────────────────── */}
      <div className="sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={!hasChanges && !saved}
          className={clsx(
            'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xl',
            saved
              ? 'bg-income/20 text-income border border-income/30'
              : hasChanges
                ? 'bg-primary text-bg hover:bg-primary-dark'
                : 'bg-elevated text-text-muted cursor-not-allowed'
          )}
        >
          {saved ? (
            <><Check size={16} /> Tersimpan!</>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </div>
    </div>
  );
}
