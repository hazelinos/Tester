import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, BarChart3, Target, CreditCard,
  Plus, Menu, X, TrendingUp, Settings, User, PiggyBank, Landmark,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import TransactionModal from './TransactionModal';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/history',  icon: Receipt,         label: 'Riwayat'  },
  { to: '/report',   icon: BarChart3,        label: 'Laporan'  },
  { to: '/budget',   icon: Target,           label: 'Budget'   },
  { to: '/savings',  icon: PiggyBank,        label: 'Tabungan' },
  { to: '/debt',     icon: Landmark,         label: 'Hutang'   },
  { to: '/accounts', icon: CreditCard,       label: 'Akun'     },
];

// Tab yang tampil di bottom nav mobile (max 4 + FAB tengah)
const BOTTOM_TABS = [
  { to: '/',        icon: LayoutDashboard, label: 'Beranda'  },
  { to: '/history', icon: Receipt,         label: 'Riwayat'  },
  { to: '/report',  icon: BarChart3,        label: 'Laporan'  },
  { to: '/budget',  icon: Target,           label: 'Budget'   },
];

const isMobile = () => window.innerWidth < 768;

export default function Layout() {
  const [mobile,      setMobile]      = useState(isMobile);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile());
  const [showModal,   setShowModal]   = useState(false);
  const [showMore,    setShowMore]    = useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const { settings }                  = useSettings();
  const navigate                      = useNavigate();

  useEffect(() => {
    const handle = () => {
      const m = isMobile();
      setMobile(m);
      if (!m) { setSidebarOpen(true); setShowMore(false); }
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const openAdd  = () => { setEditTx(null); setShowModal(true); };
  const openEdit = (tx) => { setEditTx(tx); setShowModal(true); };
  const goToDebt = () => navigate('/debt');

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if (mobile) {
    return (
      <div className="flex flex-col h-screen bg-bg overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-4 h-12 bg-card border-b border-border shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp size={12} className="text-primary" />
            </div>
            <span className="font-bold text-text-primary text-sm">FinanceApp</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/settings"
              className={({ isActive }) => clsx(
                'p-2 rounded-xl transition-colors',
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              )}>
              <Settings size={18} />
            </NavLink>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={13} className="text-text-muted" />
              }
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ openEdit }} />
        </main>

        {/* ── Bottom Navigation ────────────────────── */}
        <nav className="shrink-0 bg-card border-t border-border z-20"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-around px-1 h-14 relative">
            {BOTTOM_TABS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all flex-1',
                  isActive ? 'text-primary' : 'text-text-muted'
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                      isActive && 'bg-primary/15'
                    )}>
                      <Icon size={19} />
                    </div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* FAB tengah — Tambah */}
            <button
              onClick={openAdd}
              className="flex flex-col items-center gap-0.5 px-3 py-1 flex-1"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg -mt-4">
                <Plus size={22} className="text-bg font-bold" />
              </div>
              <span className="text-[10px] font-medium text-primary mt-0.5">Tambah</span>
            </button>

            {/* More menu */}
            <button
              onClick={() => setShowMore(!showMore)}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all flex-1',
                showMore ? 'text-primary' : 'text-text-muted'
              )}
            >
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center transition-all', showMore && 'bg-primary/15')}>
                <Menu size={19} />
              </div>
              <span className="text-[10px] font-medium">Lainnya</span>
            </button>
          </div>

          {/* More drawer */}
          {showMore && (
            <div className="border-t border-border bg-card px-4 py-3 grid grid-cols-3 gap-2"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
              {[
                { to: '/savings',  icon: PiggyBank, label: 'Tabungan' },
                { to: '/debt',     icon: Landmark,  label: 'Hutang'   },
                { to: '/accounts', icon: CreditCard, label: 'Akun'    },
              ].map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => clsx(
                    'flex flex-col items-center gap-1 py-2 rounded-xl border transition-all',
                    isActive
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-elevated text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

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

  // ── DESKTOP LAYOUT ─────────────────────────────────────────
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <aside className={clsx(
        'flex flex-col bg-card border-r border-border transition-all duration-200 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16'
      )}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-primary" />
          </div>
          {sidebarOpen && <span className="font-bold text-text-primary text-sm truncate">FinanceApp</span>}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button onClick={openAdd}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
              'bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold',
              !sidebarOpen && 'justify-center'
            )}>
            <Plus size={18} className="shrink-0" />
            {sidebarOpen && <span>Tambah</span>}
          </button>
        </div>

        <div className="border-t border-border">
          <div className="p-2">
            <NavLink to="/settings"
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
              title={!sidebarOpen ? 'Pengaturan' : undefined}>
              <Settings size={18} className="shrink-0" />
              {sidebarOpen && <span>Pengaturan</span>}
            </NavLink>
          </div>
          <div className={clsx('flex items-center gap-3 px-3 py-3 border-t border-border', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center shrink-0">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={15} className="text-text-muted" />}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{settings.name}</p>
                <p className="text-xs text-text-muted">Pengguna</p>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center h-9 border-t border-border text-text-muted hover:text-text-secondary transition-colors">
          {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet context={{ openEdit }} />
      </main>

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
