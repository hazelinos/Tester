import { useState, useRef } from 'react';
import { RotateCcw, Download, Upload, FileJson } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useFinance } from '../context/FinanceContext';
import { useIsMobile } from '../hooks/useIsMobile';
import clsx from 'clsx';

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
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  a.href = url;
  a.download = `Montra-Backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const mobile = useIsMobile();
  const { settings } = useSettings();
  const finance = useFinance();
  const { transactions, accounts, budgets, savings, debts, subscriptions } = finance;
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const importInputRef = useRef(null);

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

  const padding = mobile ? 'px-3 pb-24' : 'p-6 max-w-xl mx-auto';

  return (
    <div className={clsx('space-y-4 pt-3', padding)}>
      {!mobile && <div><h1 className="text-2xl font-bold text-text-primary">Pengaturan</h1><p className="text-text-muted text-sm mt-0.5">Kelola tampilan dan data Montra</p></div>}
      {mobile && <p className="text-base font-bold text-text-primary">Pengaturan</p>}

      <div className="card space-y-3">
        <div><h2 className="text-sm font-bold text-text-primary">Backup & Restore</h2><p className="text-xs text-text-muted mt-0.5">Simpan semua data ke file JSON atau pulihkan dari backup sebelumnya</p></div>
        <div className="bg-bg rounded-xl p-3 border border-border"><div className="flex items-center gap-2 mb-2"><FileJson size={14} className="text-primary" /><span className="text-xs font-semibold text-text-primary">Data saat ini</span></div><div className="grid grid-cols-3 gap-2">{[
          { label: 'Transaksi', val: transactions.length }, { label: 'Akun', val: accounts.length }, { label: 'Budget', val: budgets.length }, { label: 'Tabungan', val: savings?.length || 0 }, { label: 'Hutang', val: debts?.length || 0 }, { label: 'Langganan', val: subscriptions?.length || 0 },
        ].map((s) => <div key={s.label} className="text-center"><p className="text-sm font-bold text-text-primary">{s.val}</p><p className="text-[10px] text-text-muted">{s.label}</p></div>)}</div></div>
        <div className="grid grid-cols-2 gap-2"><button onClick={() => exportData(finance, settings)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold border border-primary/20"><Download size={15} /> Simpan File</button><button onClick={() => importInputRef.current?.click()} disabled={importing} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-elevated hover:bg-border transition-colors text-sm font-semibold border border-border text-text-secondary disabled:opacity-50"><Upload size={15} /> Restore File</button><input ref={importInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" /></div>
        {importMsg && <div className={clsx('rounded-xl px-3 py-2.5 text-xs font-medium', importMsg.type === 'success' ? 'bg-income/10 text-income border border-income/30' : 'bg-expense/10 text-expense border border-expense/30')}>{importMsg.type === 'success' ? '✓ ' : '✕ '}{importMsg.text}</div>}
        <p className="text-[10px] text-text-muted">File backup berformat .json dan berisi semua data termasuk transaksi, akun, budget, tabungan, hutang, dan langganan.</p>
      </div>

      <div className="card space-y-3 border-expense/20"><h2 className="text-sm font-bold text-expense">Zona Berbahaya</h2><p className="text-xs text-text-muted">Sebaiknya backup data dulu sebelum reset.</p><button onClick={() => { if (window.confirm('Reset semua data? Semua transaksi, akun, budget, tabungan, hutang, dan langganan akan dihapus permanen.')) { localStorage.clear(); window.location.reload(); } }} className="btn-danger flex items-center gap-2 text-sm"><RotateCcw size={14} /> Reset Semua Data</button></div>
    </div>
  );
}
