import React from 'react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function Footer() {
  const { settings } = useSiteSettings();

  return <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:px-6">
    <div className="mx-auto flex min-h-12 w-full max-w-[1600px] flex-wrap items-center justify-between gap-3">
      <p className="font-semibold text-slate-800">{settings.site_name || 'PeopleOS'} HRM <span className="font-normal text-slate-400">|</span> Bangladesh</p>
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
        <span className="border border-teal-200 bg-teal-50 px-2.5 py-1 text-teal-800">Payroll ready</span>
        <span>{settings.tagline || 'Secure human resource operations'}</span>
      </div>
    </div>
  </footer>;
}
