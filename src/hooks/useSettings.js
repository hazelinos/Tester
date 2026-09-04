import { useState, useEffect } from 'react';

const DEFAULTS = {
  name: 'Pengguna',
  subtitle: 'Semangat kelola keuanganmu!',
  avatar: null, // base64 string or null
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

export const useSettings = () => {
  const [settings, setSettings] = useState(load);

  const updateSettings = (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return { settings, updateSettings };
};
