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
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
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
