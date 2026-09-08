import { useState, useRef } from 'react';
import { RotateCcw, Download, Upload, Cloud, ChevronRight } from 'lucide-react';
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
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [showBackupRestore, setShowBackupRestore] = useState(false);
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
        setShowBackupRestore(false);
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
      <h1 className={clsx('font-bold text-text-primary', mobile ? 'text-base' : 'text-2xl')}>Pengaturan</h1>

      <section className="space-y-1.5">
        <h2 className="px-1 text-xs font-bold text-text-muted">Data</h2>
        <button
          type="button"
          onClick={() => { setImportMsg(null); setShowBackupRestore(true); }}
          className="card w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-elevated"
        >
          <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cloud size={19} strokeWidth={2} />
          </span>
          <span className="flex-1 text-sm font-semibold text-text-primary">Backup & Restore</span>
          <ChevronRight size={17} className="text-text-muted shrink-0" />
        </button>
      </section>

      <button
        type="button"
        onClick={() => { if (window.confirm('Reset semua data? Semua transaksi, akun, budget, tabungan, hutang, dan langganan akan dihapus permanen.')) { localStorage.clear(); window.location.reload(); } }}
        className="w-full flex items-center gap-3 rounded-xl border border-expense/40 bg-expense/10 px-3 py-2.5 text-left transition-colors hover:bg-expense/15"
      >
        <span className="w-9 h-9 rounded-lg bg-expense/10 text-expense flex items-center justify-center shrink-0">
          <RotateCcw size={19} strokeWidth={2} />
        </span>
        <span className="flex-1 text-sm font-semibold text-expense">Reset semua data</span>
        <ChevronRight size={17} className="text-text-muted shrink-0" />
      </button>

      {showBackupRestore && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-3" onClick={() => setShowBackupRestore(false)}>
          <div className="w-full max-w-md card space-y-1.5 p-3" onClick={(e) => e.stopPropagation()}>
            <div className="px-1 pb-1.5">
              <h3 className="text-sm font-bold text-text-primary">Backup & Restore</h3>
            </div>
            <button
              type="button"
              onClick={() => exportData(finance, settings)}
              className="w-full flex items-center gap-3 rounded-lg bg-elevated px-3 py-2.5 text-left hover:bg-border transition-colors"
            >
              <Download size={17} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary">Backup data</span>
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center gap-3 rounded-lg bg-elevated px-3 py-2.5 text-left hover:bg-border transition-colors disabled:opacity-50"
            >
              <Upload size={17} className="text-primary" />
              <span className="text-sm font-semibold text-text-primary">Restore data</span>
            </button>
            <input ref={importInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            {importMsg && <div className={clsx('rounded-lg px-3 py-2 text-xs font-medium', importMsg.type === 'success' ? 'bg-income/10 text-income border border-income/30' : 'bg-expense/10 text-expense border border-expense/30')}>{importMsg.type === 'success' ? '✓ ' : '✕ '}{importMsg.text}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
