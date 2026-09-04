import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, BarChart3, Target, CreditCard,
  Plus, Menu, X, TrendingUp, Settings, User, PiggyBank, Landmark,
} from 'lucide-react';
import { useSettings, ALL_NAV_OPTIONS } from '../context/SettingsContext';
import TransactionModal from './TransactionModal';
import clsx from 'clsx';

// Map route id → lucide icon
const ICON_MAP = {
  '/':         LayoutDashboard,
  '/history':  Receipt,
  '/report':   BarChart3,
  '/budget':   Target,
  '/savings':  PiggyBank,
  '/debt':     Landmark,
  '/accounts': CreditCard,
  '/settings': Settings,
};

const ALL_NAV_ITEMS = ALL_NAV_OPTIONS.map((o) => ({
  ...o,
  icon: ICON_MAP[o.id] || LayoutDashboard,
}));

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
      if (!m) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const openAdd  = () => { setEditTx(null); setShowModal(true); };
  const openEdit = (tx) => { setEditTx(tx); setShowModal(true); };
  const goToDebt = () => navigate('/debt');

  // Resolve tabs dari settings (default 4)
  const tabIds   = settings.bottomTabs || ['/', '/history', '/report', '/budget'];
  const leftTabs  = tabIds.slice(0, 2).map((id) => ALL_NAV_ITEMS.find((n) => n.id === id)).filter(Boolean);
  const rightTabs = tabIds.slice(2, 4).map((id) => ALL_NAV_ITEMS.find((n) => n.id === id)).filter(Boolean);

  // ── MOBILE ──────────────────────────────────────────────────
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
                'p-1.5 rounded-xl transition-colors',
                isActive ? 'text-primary' : 'text-text-muted'
              )}>
              <Settings size={17} />
            </NavLink>
            <div className="w-7 h-7 rounded-full overflow-hidden border border-border bg-elevated flex items-center justify-center ml-1">
              {settings.avatar
                ? <img src={settings.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <User size={13} className="text-text-muted" />}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet context={{ openEdit }} />
        </main>

        {/* ── Bottom Navigation ────────────────────── */}
        <nav className="shrink-0 bg-card border-t border-border z-20 relative"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-end justify-around px-2 h-16">

            {/* Left 2 tabs */}
            {leftTabs.map(({ id, icon: Icon, label }) => (
              <NavLink key={id} to={id} end={id === '/'}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all flex-1',
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
            <div className="flex flex-col items-center flex-1 relative" style={{ marginBottom: 4 }}>
              <button
                onClick={openAdd}
                className="flex flex-col items-center gap-0.5 group"
              >
                {/* Elevated circle dengan shadow + gradient */}
                <div className="relative -mt-5">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full blur-md opacity-60"
                    style={{ background: 'radial-gradient(circle, #A8E6CF, #6BCF9F)', transform: 'scale(1.3)' }} />
                  {/* Button */}
                  <div className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #A8E6CF, #6BCF9F)' }}>
                    <Plus size={26} className="text-bg font-black" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary mt-1 leading-none">Tambah</span>
              </button>
            </div>

            {/* Right 2 tabs */}
            {rightTabs.map(({ id, icon: Icon, label }) => (
              <NavLink key={id} to={id} end={id === '/'}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all flex-1',
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
          {ALL_NAV_ITEMS.filter(n => n.id !== '/settings').map(({ id, icon: Icon, label }) => (
            <NavLink key={id} to={id} end={id === '/'}
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
          <div className={clsx('flex items-center gap-3 px-3 py-3 border-t border-border', !sidebarOpen && 'justify-center')}>
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
    </div>
  );
}
