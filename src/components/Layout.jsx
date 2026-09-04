import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Settings,
  Plus, Menu, X, TrendingUp, User,
  BarChart3, Target, PiggyBank, Landmark, Rss,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import TransactionModal from './TransactionModal';
import { SalaryReminderPopup } from '../pages/Accounts';
import clsx from 'clsx';

// Desktop sidebar — semua halaman
const SIDEBAR_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/history',      icon: BarChart3,        label: 'Aktivitas'  },
  { to: '/report',       icon: BarChart3,        label: 'Laporan'    },
  { to: '/budget',       icon: Target,           label: 'Budget'     },
  { to: '/savings',      icon: PiggyBank,        label: 'Tabungan'   },
  { to: '/debt',         icon: Landmark,         label: 'Hutang'     },
  { to: '/subscriptions',icon: Rss,           label: 'Langganan'  },
  { to: '/accounts',     icon: CreditCard,    label: 'Akun'       },
];

// Mobile bottom nav — 4 tab permanen: 2 kiri + FAB + 2 kanan
const LEFT_TABS  = [
  { to: '/',        icon: LayoutDashboard, label: 'Beranda'   },
  { to: '/history', icon: BarChart3,        label: 'Aktivitas' },
];
const RIGHT_TABS = [
  { to: '/accounts', icon: CreditCard, label: 'Akun'    },
  { to: '/settings', icon: Settings,   label: 'Setting' },
];

const isMobile = () => window.innerWidth < 768;

export default function Layout() {
  const [mobile,      setMobile]      = useState(isMobile);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile());
  const [showModal,   setShowModal]   = useState(false);
  const [editTx,      setEditTx]      = useState(null);
  const { settings }                  = useSettings();
  const navigate                      = useNavigate();

  useEffect(() => {
    const handle = () => {
      const m = isMobile();
      setMobile(m);
      setSidebarOpen(!m);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const openAdd  = () => { setEditTx(null); setShowModal(true); };
  const openEdit = (tx) => { setEditTx(tx); setShowModal(true); };
  const goToDebt = () => navigate('/debt');

  // ── MOBILE ──────────────────────────────────────────────────
  if (mobile) {
    return (
      <div className="flex flex-col h-screen bg-bg overflow-hidden">
        {/* Top header — hanya logo + avatar */}
        <header className="flex items-center justify-between px-4 h-12 bg-card border-b border-border shrink-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp size={12} className="text-primary" />
            </div>
            <span className="font-bold text-text-primary text-sm">FinanceApp</span>
          </div>
          {/* Avatar saja — tanpa icon setting */}
          <NavLink to="/settings">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-border bg-elevated flex items-center justify-center">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={14} className="text-text-muted" />}
            </div>
          </NavLink>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ openEdit }} />
        </main>

        {/* ── Bottom Navigation ─────────────────── */}
        <nav
          className="shrink-0 bg-card border-t border-border z-20"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-end justify-around px-2 h-16">

            {/* Left 2 tabs */}
            {LEFT_TABS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-3 transition-all flex-1',
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
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* ── FAB Tengah ─────────────────────── */}
            <div className="flex flex-col items-center flex-1">
              <button onClick={openAdd} className="flex flex-col items-center gap-0.5">
                <div className="relative -mt-5">
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-full blur-md opacity-50"
                    style={{ background: 'radial-gradient(circle, #A8E6CF, #6BCF9F)', transform: 'scale(1.4)' }}
                  />
                  {/* Circle */}
                  <div
                    className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #A8E6CF, #6BCF9F)' }}
                  >
                    <Plus size={28} className="text-bg" strokeWidth={2.5} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary mt-1 leading-none">Tambah</span>
              </button>
            </div>

            {/* Right 2 tabs */}
            {RIGHT_TABS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-3 transition-all flex-1',
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
                    <span className="text-[10px] font-medium leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {showModal && (
          <TransactionModal
            editTx={editTx}
            onClose={() => { setShowModal(false); setEditTx(null); }}
            navigateToDebt={goToDebt}
          />
        )}
        <SalaryReminderPopup />
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────
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
          {SIDEBAR_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx('nav-item', isActive && 'nav-item-active')}
              title={!sidebarOpen ? label : undefined}>
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
          <div className={clsx(
            'flex items-center gap-3 px-3 py-3 border-t border-border',
            !sidebarOpen && 'justify-center'
          )}>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center shrink-0">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={15} className="text-text-muted" />}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">{settings.name}</p>
                <p className="text-xs text-text-muted truncate">
                  {settings.googleUser ? settings.googleUser.email : 'Pengguna'}
                </p>
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
      <SalaryReminderPopup />
    </div>
  );
}
