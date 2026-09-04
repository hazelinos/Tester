import { createContext, useContext, useState } from 'react';

const DEFAULT_TABS = ['/', '/history', '/budget', '/savings'];

const DEFAULTS = {
  name:       'Pengguna',
  subtitle:   'Semangat kelola keuanganmu!',
  avatar:     null,
  bottomTabs: DEFAULT_TABS,
};

const STORAGE_KEY = 'finance_settings';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    // Migrate the previous default subtitle so the emoji is removed automatically.
    if (saved.subtitle === 'Semangat kelola keuanganmu! 👋') {
      saved.subtitle = DEFAULTS.subtitle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    return { ...DEFAULTS, ...saved };
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

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};
