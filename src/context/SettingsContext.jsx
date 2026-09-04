import { createContext, useContext, useState } from 'react';

// Tab yang tersedia untuk dipilih di bottom nav
export const ALL_NAV_OPTIONS = [
  { id: '/',         label: 'Beranda',  icon: '🏠' },
  { id: '/history',  label: 'Riwayat',  icon: '🧾' },
  { id: '/report',   label: 'Laporan',  icon: '📊' },
  { id: '/budget',   label: 'Budget',   icon: '🎯' },
  { id: '/savings',  label: 'Tabungan', icon: '🐷' },
  { id: '/debt',     label: 'Hutang',   icon: '🏦' },
  { id: '/accounts', label: 'Akun',     icon: '💳' },
  { id: '/settings', label: 'Setting',  icon: '⚙️' },
];

// Default 4 tab: 2 kiri + 2 kanan (tengah = FAB +)
const DEFAULT_TABS = ['/', '/history', '/budget', '/savings'];

const DEFAULTS = {
  name:     'Pengguna',
  subtitle: 'Semangat kelola keuanganmu! 👋',
  avatar:   null,
  googleUser: null,  // { name, email, picture }
  bottomTabs: DEFAULT_TABS,
};

const STORAGE_KEY = 'finance_settings';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(load);

  const updateSettings = (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Login Google — simpan profil dari Google
  const loginWithGoogle = (googleUser) => {
    updateSettings({
      googleUser,
      name:   googleUser.name,
      avatar: googleUser.picture,
    });
  };

  const logoutGoogle = () => {
    updateSettings({ googleUser: null });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loginWithGoogle, logoutGoogle }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};
