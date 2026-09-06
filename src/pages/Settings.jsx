import { useState, useRef } from 'react';
import { Camera, User, Trash2, Check, RotateCcw, Download, Upload, FileJson, ChevronUp, ChevronDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import clsx from 'clsx';

const SHORTCUT_OPTIONS = [
  { id: '/savings', label: 'Tabungan' },
  { id: '/budget', label: 'Budget' },
  { id: '/debt', label: 'Hutang' },
  { id: '/subscriptions', label: 'Langganan' },
  { id: '/history', label: 'Aktivitas' },
  { id: '/report', label: 'Laporan' },
  { id: '/accounts', label: 'Akun' },
];
const SHORTCUT_KEY = 'dashboard_shortcuts';
const DEFAULT_SHORTCUTS = ['/savings', '/budget', '/debt', '/subscriptions'];

function loadShortcutOrder() {
  try {
    const raw = localStorage.getItem(SHORTCUT_KEY);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS;
    if (!Array.isArray(parsed)) return DEFAULT_SHORTCUTS;
    const valid = parsed.filter((id) => SHORTCUT_OPTIONS.some((item) => item.id === id));
    return valid.length >= 2 ? valid.slice(0, 4) : DEFAULT_SHORTCUTS;
  } catch {
    return DEFAULT_SHORTCUTS;
  }
}

function ShortcutOrdering() {
  const [order, setOrder] = useState(loadShortcutOrder);
  const [saved, setSaved] = useState(false);

  const move = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem(SHORTCUT_KEY, JSON.stringify(order));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="card space-y-3">
      <div>
        <h2 className="text-sm font-bold text-text-primary">Urutan Shortcut Dashboard</h2>
        <p className="text-xs text-text-muted mt-0.5">Atur mana yang tampil sebagai nomor 1, 2, 3, dan 4.</p>
      </div>
      <div className="space-y-2">
        {order.map((id, index) => {
          const item = SHORTCUT_OPTIONS.find((option) => option.id === id);
          if (!item) return null;
          return (
            <div key={id} className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{index + 1}</span>
              <span className="flex-1 text-sm font-semibold text-text-primary">{item.label}</span>
              <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Naikkan ${item.label}`} className="w-8 h-8 rounded-lg bg-elevated text-text-secondary flex items-center justify-center disabled:opacity-25 hover:bg-border transition-colors"><ChevronUp size={16} /></button>
              <button onClick={() => move(index, 1)} disabled={index === order.length - 1} aria-label={`Turunkan ${item.label}`} className="w-8 h-8 rounded-lg bg-elevated text-text-secondary flex items-center justify-center disabled:opacity-25 hover:bg-border transition-colors"><ChevronDown size={16} /></button>
            </div>
          );
        })}
      </div>
      <button onClick={save} className={clsx('w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all', saved ? 'bg-income/20 text-income border border-income/30' : 'bg-primary text-bg hover:bg-primary-dark')}>
        {saved ? <><Check size={15} /> Urutan Tersimpan</> : 'Simpan Urutan'}
      </button>
    </div>
  );
}

function exportData(finance, settingsData) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: settingsData,
    transactions: finance.transactions,
    accounts: finance.accounts,
    budgets: finance.budgets,
    savings: finance.savings,
    debts: finance.debts,
    subscriptions: finance.subscriptions || [],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  a.href = url;
  a.download = `financeapp-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const mobile = useIsMobile();
  const { settings, updateSettings } = useSettings();
  const finance = useFinance();
  const { transactions, accounts, budgets, savings, debts, subscriptions } = finance;
  const [name, setName] = useState(settings.name);
  const [subtitle, setSubtitle] = useState(settings.subtitle);
  const [avatar, setAvatar] = useState(settings.avatar);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings({ name: name.trim() || 'Pengguna', subtitle: subtitle.trim() || 'Semangat kelola keuanganmu! 👋', avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { setImportMsg({ type: 'error', text: 'File harus berformat .json' }); return; }
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !data.transactions || !data.accounts) throw new Error('Format file tidak valid');
        if (!window.confirm(`Restore data dari backup ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('id-ID') : ''}?\n\n` + `• ${data.transactions?.length || 0} transaksi\n` + `• ${data.accounts?.length || 0} akun\n` + `• ${data.budgets?.length || 0} budget\n` + `• ${data.savings?.length || 0} tabungan\n` + `• ${data.debts?.length || 0} hutang\n` + `• ${data.subscriptions?.length || 0} langganan\n\n` + `Data yang ada sekarang akan diganti.`)) {
          setImporting(false); return;
        }
        localStorage.setItem('finance_transactions', JSON.stringify(data.transactions || []));
        localStorage.setItem('finance_accounts', JSON.stringify(data.accounts || []));
        localStorage.setItem('finance_budgets', JSON.stringify(data.budgets || []));
        localStorage.setItem('finance_savings', JSON.stringify(data.savings || []));
        localStorage.setItem('finance_debts', JSON.stringify(data.debts || []));
        localStorage.setItem('finance_subscriptions', JSON.stringify(data.subscriptions || []));
        if (data.settings) localStorage.setItem('finance_settings', JSON.stringify(data.settings));
        setImportMsg({ type: 'success', text: 'Data berhasil di-restore! Halaman akan dimuat ulang...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setImportMsg({ type: 'error', text: `Gagal import: ${err.message}` });
      } finally {
        setImporting(false);
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const hasChanges = name !== settings.name || subtitle !== settings.subtitle || avatar !== settings.avatar;
  const padding = mobile ? 'px-3 pb-24' : 'p-6 max-w-xl mx-auto';

  return (
    <div className={clsx('space-y-4 pt-3', padding)}>
      {!mobile && <div><h1 className="text-2xl font-bold text-text-primary">Pengaturan</h1><p className="text-text-muted text-sm mt-0.5">Kelola profil dan preferensi</p></div>}
      {mobile && <p className="text-base font-bold text-text-primary">Pengaturan</p>}

      <div className="card space-y-4">
        <h2 className="text-sm font-bold text-text-primary">Profil</h2>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border bg-elevated flex items-center justify-center">{avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={28} className="text-text-muted" />}</div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg"><Camera size={11} className="text-bg" /></button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-text-secondary">Foto profil di header & sidebar</p>
            <div className="flex gap-2"><button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1"><Camera size={11} /> Ganti</button>{avatar && <button onClick={() => { setAvatar(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn-danger text-xs px-2.5 py-1.5 flex items-center gap-1"><Trash2 size={11} /> Hapus</button>}</div>
          </div>
        </div>
        <div><label className="text-xs text-text-muted block mb-1.5">Nama</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" maxLength={30} className="input" /></div>
        <div><label className="text-xs text-text-muted block mb-1.5">Subtitle Dashboard</label><input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Semangat kelola keuanganmu! 👋" maxLength={60} className="input" /></div>
        <div className="bg-bg rounded-xl p-3 border border-border"><p className="text-[10px] text-text-muted mb-1.5">Preview</p><p className="text-base font-bold text-text-primary">Halo, {name || 'Pengguna'} 👋</p><p className="text-xs text-text-muted">{subtitle || 'Semangat kelola keuanganmu! 👋'}</p></div>
        <button onClick={handleSave} disabled={!hasChanges && !saved} className={clsx('w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all', saved ? 'bg-income/20 text-income border border-income/30' : hasChanges ? 'bg-primary text-bg hover:bg-primary-dark' : 'bg-elevated text-text-muted cursor-not-allowed')}>{saved ? <><Check size={15} /> Tersimpan!</> : 'Simpan Perubahan'}</button>
      </div>

      <ShortcutOrdering />

      <div className="card space-y-3">
        <div><h2 className="text-sm font-bold text-text-primary">Backup & Restore</h2><p className="text-xs text-text-muted mt-0.5">Simpan semua data ke file JSON atau pulihkan dari backup sebelumnya</p></div>
        <div className="bg-bg rounded-xl p-3 border border-border"><div className="flex items-center gap-2 mb-2"><FileJson size={14} className="text-primary" /><span className="text-xs font-semibold text-text-primary">Data saat ini</span></div><div className="grid grid-cols-3 gap-2">{[
          { label: 'Transaksi', val: transactions.length }, { label: 'Akun', val: accounts.length }, { label: 'Budget', val: budgets.length }, { label: 'Tabungan', val: savings?.length || 0 }, { label: 'Hutang', val: debts?.length || 0 }, { label: 'Langganan', val: subscriptions?.length || 0 },
        ].map((s) => <div key={s.label} className="text-center"><p className="text-sm font-bold text-text-primary">{s.val}</p><p className="text-[10px] text-text-muted">{s.label}</p></div>)}</div></div>
        <div className="grid grid-cols-2 gap-2"><button onClick={() => exportData(finance, settings)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold border border-primary/20"><Download size={15} /> Simpan File</button><button onClick={() => importInputRef.current?.click()} disabled={importing} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-elevated hover:bg-border transition-colors text-sm font-semibold border border-border text-text-secondary disabled:opacity-50"><Upload size={15} /> Restore File</button><input ref={importInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" /></div>
        {importMsg && <div className={clsx('rounded-xl px-3 py-2.5 text-xs font-medium', importMsg.type === 'success' ? 'bg-income/10 text-income border border-income/30' : 'bg-expense/10 text-expense border border-expense/30')}>{importMsg.type === 'success' ? '✓ ' : '✕ '}{importMsg.text}</div>}
        <p className="text-[10px] text-text-muted">File backup berformat .json dan berisi semua data termasuk transaksi, akun, budget, tabungan, hutang, dan langganan.</p>
      </div>

      <div className="card space-y-3"><h2 className="text-sm font-bold text-text-primary">Statistik Data</h2><div className="grid grid-cols-3 gap-2">{[
        { label: 'Transaksi', val: transactions.length, icon: '📋' }, { label: 'Akun', val: accounts.length, icon: '🏦' }, { label: 'Budget', val: budgets.length, icon: '🎯' }, { label: 'Tabungan', val: savings?.length || 0, icon: '🐷' }, { label: 'Hutang', val: debts?.length || 0, icon: '💸' }, { label: 'Langganan', val: subscriptions?.length || 0, icon: '📡' },
      ].map((s) => <div key={s.label} className="bg-bg rounded-xl p-2.5 text-center border border-border"><p className="text-xl mb-0.5">{s.icon}</p><p className="text-base font-bold text-text-primary">{s.val}</p><p className="text-[10px] text-text-muted">{s.label}</p></div>)}</div></div>

      <div className="card space-y-3 border-expense/20"><h2 className="text-sm font-bold text-expense">Zona Berbahaya</h2><p className="text-xs text-text-muted">Sebaiknya backup data dulu sebelum reset.</p><button onClick={() => { if (window.confirm('Reset semua data? Semua transaksi, akun, budget, tabungan, hutang, dan langganan akan dihapus permanen.')) { localStorage.clear(); window.location.reload(); } }} className="btn-danger flex items-center gap-2 text-sm"><RotateCcw size={14} /> Reset Semua Data</button></div>
    </div>
  );
}
