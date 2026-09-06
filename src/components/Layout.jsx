import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Settings,
  Plus, Menu, X, User, BarChart3, Target, PiggyBank, Landmark, Rss,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import TransactionModal from './TransactionModal';
import { SalaryReminderPopup } from '../pages/Accounts';
import MontraLogo from './MontraLogo';
import clsx from 'clsx';

// Desktop sidebar — semua halaman
const SIDEBAR_ITEMS = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/history',       icon: BarChart3,        label: 'Aktivitas'  },
  { to: '/budget',        icon: Target,           label: 'Budget'     },
  { to: '/savings',       icon: PiggyBank,        label: 'Tabungan'   },
  { to: '/debt',          icon: Landmark,         label: 'Hutang'     },
  { to: '/subscriptions', icon: Rss,              label: 'Langganan'  },
  { to: '/accounts',      icon: CreditCard,       label: 'Akun'       },
];

const TOP_TABS = [
  { to: '/history', icon: BarChart3, label: 'Aktivitas' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/settings', icon: Settings, label: 'Setting' },
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
        <nav
          className="shrink-0 sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border z-30"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="grid grid-cols-3 items-center px-3 h-14">
            {TOP_TABS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => clsx(
                  'flex items-center justify-center gap-2 h-10 rounded-xl transition-all text-xs font-semibold',
                  isActive ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ openEdit }} />
        </main>

        <button
          onClick={openAdd}
          aria-label="Tambah transaksi"
          className="fixed right-5 bottom-5 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #A8E6CF, #6BCF9F)' }}
        >
          <Plus size={28} className="text-bg" strokeWidth={2.5} />
        </button>

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
          <MontraLogo size={32} />
          {sidebarOpen && <span className="font-bold text-text-primary text-sm truncate">Montra<span className="text-primary">App</span></span>}
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
