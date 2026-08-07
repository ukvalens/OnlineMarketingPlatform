import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'site_settings';

const DEFAULTS = {
  site_title:     'DigitalMarkRW',
  contact_email:  'info@digitalmarkrw.com',
  phone:          '+250 780 000 000',
  address:        'KG 123 St, Kigali, Rwanda',
  tin:            '123456789',
  website:        'www.digitalmarkrw.com',
  tagline:        'Digital Marketing & Business Promotion',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  const saveSettings = (next) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, saveSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);

/** Read settings synchronously from localStorage (for use outside React, e.g. api.js) */
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}
