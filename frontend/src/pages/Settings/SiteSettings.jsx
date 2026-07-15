import React, { useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  PhotoIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { siteSettingsService } from '../../services/siteSettingsService';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

const inputClass = 'h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100';

export default function SiteSettings() {
  const { settings, refreshSettings, setSettings } = useSiteSettings();
  const [form, setForm] = useState({
    site_name: '',
    short_name: '',
    tagline: '',
    primary_color: '#0f766e',
    support_email: '',
    support_phone: '',
    address: '',
  });
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeFavicon, setRemoveFavicon] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setForm({
      site_name: settings.site_name || '',
      short_name: settings.short_name || '',
      tagline: settings.tagline || '',
      primary_color: settings.primary_color || '#0f766e',
      support_email: settings.support_email || '',
      support_phone: settings.support_phone || '',
      address: settings.address || '',
    });
  }, [settings]);

  const logoPreview = useMemo(() => logo ? URL.createObjectURL(logo) : settings.logo_url, [logo, settings.logo_url]);
  const faviconPreview = useMemo(() => favicon ? URL.createObjectURL(favicon) : settings.favicon_url, [favicon, settings.favicon_url]);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value || ''));
    if (logo) body.append('logo', logo);
    if (favicon) body.append('favicon', favicon);
    body.append('remove_logo', removeLogo ? '1' : '0');
    body.append('remove_favicon', removeFavicon ? '1' : '0');

    try {
      const response = await siteSettingsService.update(body);
      setSettings(response.data);
      setLogo(null);
      setFavicon(null);
      setRemoveLogo(false);
      setRemoveFavicon(false);
      setNotice({ type: 'success', message: 'Site settings updated successfully.' });
      await refreshSettings();
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to update site settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">Site Settings</h1>
          </div>
          <button type="button" onClick={refreshSettings} className="inline-flex h-11 w-fit items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {notice && <Alert type={notice.type} message={notice.message} />}

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Brand Identity</h2>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Site name">
              <input required value={form.site_name} onChange={event => update('site_name', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Short name">
              <input required maxLength="30" value={form.short_name} onChange={event => update('short_name', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Tagline">
              <input value={form.tagline} onChange={event => update('tagline', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Primary color">
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={event => update('primary_color', event.target.value)} className="h-11 w-14 border border-slate-200 bg-white p-1" />
                <input required pattern="^#[0-9A-Fa-f]{6}$" value={form.primary_color} onChange={event => update('primary_color', event.target.value)} className={inputClass} />
              </div>
            </Field>

            <UploadField label="Logo" file={logo} currentUrl={settings.logo_url} preview={logoPreview} onChange={setLogo} remove={removeLogo} onRemove={setRemoveLogo} accept=".png,.jpg,.jpeg,.webp,.svg" />
            <UploadField label="Favicon" file={favicon} currentUrl={settings.favicon_url} preview={faviconPreview} onChange={setFavicon} remove={removeFavicon} onRemove={setRemoveFavicon} accept=".png,.jpg,.jpeg,.webp,.ico,.svg" />
          </div>
        </section>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
            <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">Live Preview</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 border border-slate-200 bg-[#0f2137] p-4 text-white">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-teal-400 text-sm font-black text-[#0f2137]">
                  {logoPreview && !removeLogo ? <img src={logoPreview} alt="" className="h-full w-full object-cover" /> : form.short_name || 'HR'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{form.site_name || 'PeopleOS'}</p>
                  <p className="truncate text-xs font-semibold text-cyan-100/70">{form.tagline || 'Human resource management'}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PreviewMetric icon={GlobeAltIcon} label="Browser title" value={form.site_name || '-'} />
                <PreviewMetric icon={SwatchIcon} label="Theme color" value={form.primary_color || '-'} />
              </div>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur xl:col-span-2">
          <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Contact Details</h2>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <Field label="Support email">
              <input type="email" value={form.support_email} onChange={event => update('support_email', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Support phone">
              <input value={form.support_phone} onChange={event => update('support_phone', event.target.value)} className={inputClass} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea rows="4" value={form.address} onChange={event => update('address', event.target.value)} className="w-full resize-none border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
            </Field>
          </div>
          <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button disabled={saving} className="inline-flex h-11 items-center gap-2 bg-teal-600 px-5 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.18)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              <PaintBrushIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Site Settings'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function UploadField({ label, file, currentUrl, preview, onChange, remove, onRemove, accept }) {
  return (
    <div className="space-y-3">
      <span className="block text-xs font-black uppercase text-slate-500">{label}</span>
      <div className="flex items-center gap-4 border border-slate-200 bg-slate-50 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-white bg-white text-slate-400 shadow-sm">
          {preview && !remove ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <PhotoIcon className="h-7 w-7" />}
        </div>
        <div className="min-w-0 flex-1">
          <input type="file" accept={accept} onChange={event => onChange(event.target.files?.[0] || null)} className="w-full text-sm font-semibold text-slate-600" />
          <p className="mt-2 truncate text-xs font-semibold text-slate-500">{file?.name || (currentUrl && !remove ? 'Current file selected' : 'No file selected')}</p>
        </div>
      </div>
      {currentUrl && (
        <label className="flex items-center gap-2 text-sm font-semibold text-rose-700">
          <input type="checkbox" checked={remove} onChange={event => onRemove(event.target.checked)} className="h-4 w-4 accent-rose-600" />
          Remove current {label.toLowerCase()}
        </label>
      )}
    </div>
  );
}

function PreviewMetric({ icon: Icon, label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      {React.createElement(Icon, { className: 'h-5 w-5 text-teal-700' })}
      <p className="mt-2 text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
