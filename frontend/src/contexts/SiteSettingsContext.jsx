import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { siteSettingsService } from '../services/siteSettingsService';

const defaultSettings = {
  site_name: 'PeopleOS',
  short_name: 'HR',
  tagline: 'Human resource management',
  logo_url: null,
  favicon_url: '/myicon.png',
  primary_color: '#0f766e',
  support_email: '',
  support_phone: '',
  address: '',
};

const SiteSettingsContext = createContext();

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  return context;
};

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await siteSettingsService.get();
      setSettings({ ...defaultSettings, ...(response.data || {}) });
    } catch {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    document.title = settings.site_name || defaultSettings.site_name;
    document.documentElement.style.setProperty('--site-primary', settings.primary_color || defaultSettings.primary_color);

    const href = settings.favicon_url || defaultSettings.favicon_url;
    let icon = document.querySelector("link[rel='icon']");
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = href;

    let theme = document.querySelector("meta[name='theme-color']");
    if (!theme) {
      theme = document.createElement('meta');
      theme.name = 'theme-color';
      document.head.appendChild(theme);
    }
    theme.content = settings.primary_color || defaultSettings.primary_color;
  }, [settings.favicon_url, settings.primary_color, settings.site_name]);

  const value = useMemo(() => ({
    settings,
    loading,
    refreshSettings,
    setSettings: next => setSettings({ ...defaultSettings, ...(next || {}) }),
  }), [loading, refreshSettings, settings]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
