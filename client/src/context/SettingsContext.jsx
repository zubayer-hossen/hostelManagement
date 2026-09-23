import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsApi } from '../api/settings.js';
import { applyTheme } from '../utils/theme.js';

const DEFAULTS = {
  general: { hostelName: 'Digital Hostel', tagline: '', description: '', logoUrl: '', faviconUrl: '', address: '' },
  contact: { phone: '', email: '', emergencyPhone: '', officeHours: '', supportInfo: '' },
  social: {},
  location: {},
  emergency: {},
  footer: {},
  meetings: {},
  residentForm: {},
  visitorStats: { showOnlineNow: true, showToday: true, showTotal: true },
  theme: { mode: 'system', primaryColor: '#4f46e5', secondaryColor: '#0ea5e9', accentColor: '#f59e0b', borderRadius: 'lg', animations: true },
  seo: { siteTitle: '', metaDescription: '' },
};

const SettingsContext = createContext(null);

// Keep every group the API returns (so newer settings sections are never silently dropped), with safe defaults underneath.
const merge = (incoming = {}) => ({
  ...incoming,
  ...Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, { ...v, ...(incoming[k] || {}) }])),
});

function setFavicon(url) {
  if (!url) return;
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await settingsApi.getPublic();
      setSettings(merge(res.data));
    } catch {
      setSettings(DEFAULTS); // site stays usable with defaults if the API is unreachable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    applyTheme(settings.theme);
    document.title = settings.seo.siteTitle || settings.general.hostelName;
    setFavicon(settings.general.faviconUrl);
  }, [settings]);

  const value = useMemo(() => ({ settings, loading, reload: load }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
};
