import React, { useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();

  const useAdminCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('password');
    setError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data?.errors;
      const validationMessage = errors ? Object.values(errors).flat().join(' ') : '';
      setError(err.response?.data?.message || validationMessage || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#0f2137_0%,#123352_48%,#0f766e_100%)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
      <div className="absolute right-0 top-16 h-72 w-[42rem] -skew-x-12 bg-white/10" />
      <div className="absolute bottom-0 left-0 h-52 w-[34rem] skew-x-12 bg-teal-300/10" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1220px] items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_500px] lg:px-8">
        <section className="hidden text-white lg:block">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.site_name || 'Site logo'} className="max-h-24 max-w-[360px] object-contain object-left" />
          ) : (
            <h1 className="text-5xl font-black leading-tight">{settings.site_name || 'PeopleOS'}</h1>
          )}
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-cyan-50/75">
            {settings.tagline || 'Human resource management'} for secure workforce operations, payroll, attendance and employee services.
          </p>
          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <Feature label="Secure access" />
            <Feature label="BD HR ready" />
            <Feature label="Admin controlled" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px] overflow-hidden  shadow-[0_36px_100px_rgba(2,6,23,0.38),0_8px_0_rgba(15,33,55,0.10)] backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-7 p-10">
            {error && <Alert message={error} />}

            <div>
              <div className="mb-6 flex justify-center lg:hidden">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt={settings.site_name || 'Site logo'} className="max-h-16 max-w-[240px] object-contain" />
                ) : (
                  <p className="text-3xl font-black text-white">{settings.site_name || 'PeopleOS'}</p>
                )}
              </div>
              <h2 className="text-2xl text-center font-black text-slate-100">Welcome back</h2>
            </div>            

            <FloatingField
              icon={EnvelopeIcon}
              label="Email address"
              placeholder="name@company.com"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <FloatingField
              icon={LockClosedIcon}
              label="Password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="group relative inline-flex py-4 w-full items-center justify-center gap-2 overflow-hidden bg-teal-600 px-5 text-md font-black text-white shadow-[0_14px_26px_rgba(15,118,110,0.25)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-700 disabled:shadow-[0_10px_22px_rgba(15,118,110,0.18)]"
            >
              <span className="absolute inset-x-0 top-0 h-px bg-white/45" />
              {loading ? (
                <>
                  <span className="inline-loader text-teal-700" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <div className="flex items-center justify-between gap-4 bg-white/[0.08] px-4 py-2 text-white shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <KeyIcon className="h-5 w-5 shrink-0 text-teal-300" />
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase text-cyan-100/60">Admin account</p>                  
                </div>
              </div>
              <button
                type="button"
                onClick={useAdminCredentials}
                className="shrink-0 border border-teal-300/60 bg-teal-400 px-3 py-2 text-xs font-black text-[#0f2137] transition hover:bg-teal-300"
              >
                Use credentials
              </button>              
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Feature({ label }) {
  return (
    <div className="flex items-center gap-2 border border-white/75 bg-white/10 px-4 py-3 text-sm font-bold text-cyan-50/85">
      <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-teal-300" />
      <span>{label}</span>
    </div>
  );
}

function FloatingField({ icon: Icon, label, placeholder, value, onChange, ...props }) {
  const [focused, setFocused] = useState(false);
  const active = focused || Boolean(value);

  return (
    <fieldset className={`relative border bg-slate-50 px-3 py-1 transition-all duration-200 ${focused ? 'border-teal-400 bg-white shadow-[0_14px_28px_rgba(15,118,110,0.10)] ring-4 ring-teal-100' : 'border-slate-200 hover:border-slate-300'}`}>
      <span className={`pointer-events-none absolute z-10 bg-slate-50 px-2 font-black transition-all duration-200 ${active ? '-top-2.5 left-4 text-[12px] uppercase tracking-normal text-teal-700' : 'left-12 top-1/2 -translate-y-1/2 text-md text-slate-400'}`}>
        {label}
      </span>
      <div className="relative flex h-12 items-center">
        {React.createElement(Icon, { className: `pointer-events-none h-5 w-5 shrink-0 transition-colors ${focused ? 'text-teal-600' : 'text-slate-400'}` })}
        <input
          required
          value={value}
          onChange={event => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={active ? placeholder : ''}
          className="min-w-0 flex-1 bg-transparent pl-2 pr-1 text-[15px] font-bold text-slate-900 outline-none placeholder:text-slate-400"
          {...props}
        />
      </div>
    </fieldset>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
