import React from 'react';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between text-sm">
        <div>
          <h3 className="font-semibold text-slate-900">
            {settings.site_name || "PeopleOS"}
          </h3>          
        </div>

        <p className="text-xs text-slate-500">
          © All rights reserved. | {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}