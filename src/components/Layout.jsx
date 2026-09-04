import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, BarChart3, Target, CreditCard,
  Plus, Menu, X, TrendingUp, Settings, User, PiggyBank, Landmark,
} from 'lucide-react';
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

const isMobile = () => window.innerWidth < 768;

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile());
  const [showModal,   setShowModal]   = useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const { settings }                  = useSettings();
  const navigate                      = useNavigate();
  const location                      = useLocation();

  // Tutup sidebar otomatis saat navigasi di mobile
  useEffect(() => {
    if (isMobile()) setSidebarOpen(false);
  }, [location.pathname]);

  // Tutup sidebar saat resize ke mobile
  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobile       = isMobile();
  const openAdd      = () => { setEditTx(null); setShowModal(true); };
  const openEdit     = (tx) => { setEditTx(tx); setShowModal(true); };
  const goToDebt     = () => navigate('/debt');
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">

      {/* ── Overlay mobile (tap luar untuk tutup) ── */}
      {sidebarOpen && mobile && (
        <div
          className="fixed inset-0 z-20 bg-black/60"
          onClick={closeSidebar}
        />
      )}

      {/* ── Sidebar ───────────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-col bg-card border-r border-border transition-all duration-250 shrink-0 z-30',
          // Desktop: inline, bisa collapse jadi ikon
          // Mobile: absolute overlay dari kiri
          mobile
            ? clsx('fixed top-0 left-0 h-full w-64', sidebarOpen ? 'translate-x-0' : '-translate-x-full')
            : clsx('relative', sidebarOpen ? 'w-56' : 'w-16')
        )}
        style={{ transition: 'transform 0.25s ease, width 0.2s ease' }}
      >
        {/* Logo + close (mobile) */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-primary" />
            </div>
            {(sidebarOpen || mobile) && (
              <span className="font-bold text-text-primary text-sm truncate">FinanceApp</span>
            )}
          </div>
          {mobile && (
            <button onClick={closeSidebar} className="p-1.5 rounded-lg hover:bg-elevated text-text-muted">
              <X size={18} />
            </button>
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
              title={!sidebarOpen && !mobile ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {(sidebarOpen || mobile) && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Tambah button */}
        <div className="p-2 border-t border-border">
          <button
            onClick={openAdd}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold',
              !sidebarOpen && !mobile && 'justify-center'
            )}
          >
            <Plus size={18} className="shrink-0" />
            {(sidebarOpen || mobile) && <span>Tambah</span>}
          </button>
        </div>

        {/* Profile + Settings */}
        <div className="border-t border-border">
          <div className="p-2">
            <NavLink
              to="/settings"
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
              title={!sidebarOpen && !mobile ? 'Pengaturan' : undefined}
            >
              <Settings size={18} className="shrink-0" />
              {(sidebarOpen || mobile) && <span>Pengaturan</span>}
            </NavLink>
          </div>

          {/* Profile strip */}
          <div className={clsx(
            'flex items-center gap-3 px-3 py-3 border-t border-border',
            !sidebarOpen && !mobile && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center shrink-0">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={15} className="text-text-muted" />
              }
            </div>
            {(sidebarOpen || mobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{settings.name}</p>
                <p className="text-xs text-text-muted">Pengguna</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle — hanya di desktop */}
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center h-9 border-t border-border text-text-muted hover:text-text-secondary transition-colors"
          >
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        )}
      </aside>

      {/* ── Main content ──────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        {mobile && (
          <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-elevated text-text-muted transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp size={12} className="text-primary" />
              </div>
              <span className="font-bold text-text-primary text-sm">FinanceApp</span>
            </div>
            <button
              onClick={openAdd}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        )}

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
