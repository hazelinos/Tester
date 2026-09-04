import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, BarChart3, Target, CreditCard,
  Plus, Menu, X, TrendingUp, Settings, User, PiggyBank, Landmark,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import TransactionModal from './TransactionModal';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/history',  icon: Receipt,         label: 'Riwayat'   },
  { to: '/report',   icon: BarChart3,        label: 'Laporan'   },
  { to: '/budget',   icon: Target,           label: 'Budget'    },
  { to: '/savings',  icon: PiggyBank,        label: 'Tabungan'  },
  { to: '/debt',     icon: Landmark,         label: 'Hutang'    },
  { to: '/accounts', icon: CreditCard,       label: 'Akun'      },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const { settings }                  = useSettings();
  const navigate                      = useNavigate();

  const openAdd  = () => { setEditTx(null); setShowModal(true); };
  const openEdit = (tx) => { setEditTx(tx); setShowModal(true); };
  const goToDebt = () => navigate('/debt');

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ───────────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-col bg-card border-r border-border transition-all duration-200 shrink-0',
          sidebarOpen ? 'w-56' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-primary" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-text-primary text-sm truncate">FinanceApp</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx('nav-item', isActive && 'nav-item-active')
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Add button */}
        <div className="p-2 border-t border-border">
          <button
            onClick={openAdd}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
              'text-sm font-semibold',
              !sidebarOpen && 'justify-center'
            )}
          >
            <Plus size={18} className="shrink-0" />
            {sidebarOpen && <span>Tambah</span>}
          </button>
        </div>

        {/* ── Profile + Settings ─────────────────── */}
        <div className="border-t border-border">
          {/* Settings nav item */}
          <div className="p-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx('nav-item', isActive && 'nav-item-active')
              }
              title={!sidebarOpen ? 'Pengaturan' : undefined}
            >
              <Settings size={18} className="shrink-0" />
              {sidebarOpen && <span>Pengaturan</span>}
            </NavLink>
          </div>

          {/* Profile strip */}
          <div className={clsx(
            'flex items-center gap-3 px-3 py-3 border-t border-border',
            !sidebarOpen && 'justify-center'
          )}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center shrink-0">
              {settings.avatar ? (
                <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={15} className="text-text-muted" />
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {settings.name}
                </p>
                <p className="text-xs text-text-muted truncate">Pengguna</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center h-9 border-t border-border text-text-muted hover:text-text-secondary transition-colors"
        >
          {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      </aside>

      {/* ── Main content ──────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ openEdit }} />
      </main>

      {/* ── Transaction Modal ─────────────────────── */}
      {showModal && (
        <TransactionModal
          editTx={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          navigateToDebt={goToDebt}
        />
      )}
    </div>
  );
}
