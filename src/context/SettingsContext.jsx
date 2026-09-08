import { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_TABS = ['/', '/history', '/budget', '/savings'];

const DEFAULTS = {
  name:       'Pengguna',
  subtitle:   'Semangat kelola keuanganmu!',
  avatar:     null,
  bottomTabs: DEFAULT_TABS,
  theme:      'system',
};

const STORAGE_KEY = 'finance_settings';

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    if (saved.subtitle === 'Semangat kelola keuanganmu! 👋') {
      saved.subtitle = DEFAULTS.subtitle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    return { ...DEFAULTS, ...saved };
  } catch {
    return DEFAULTS;
  }
};

const applyTheme = (theme) => {
  const root = document.documentElement;
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    applyTheme(settings.theme || 'system');
    if ((settings.theme || 'system') !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyTheme('system');
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [settings.theme]);

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
