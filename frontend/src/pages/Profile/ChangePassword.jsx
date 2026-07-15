import React, { useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';

const inputClass = 'h-12 w-full border border-slate-200 bg-slate-50 pl-11 pr-12 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100';

export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [visible, setVisible] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const response = await authService.changePassword({
        current_password: current,
        password,
        password_confirmation: passwordConfirm,
      });
      setCurrent('');
      setPassword('');
      setPasswordConfirm('');
      setNotice({ type: 'success', message: response.message || 'Password changed successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const toggleVisible = key => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[10px] bg-teal-400 text-slate-950 shadow-[0_14px_28px_rgba(20,184,166,0.28)]">
              <ShieldCheckIcon className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Change Password</h1>
            </div>
          </div>
          <Link to="/dashboard" className="inline-flex h-11 w-fit items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15">
            <ArrowLeftIcon className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {notice && <Alert type={notice.type} message={notice.message} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_1fr]">
        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Password Update</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <PasswordField label="Current password" placeholder="Enter current password" value={current} onChange={setCurrent} visible={visible.current} onToggle={() => toggleVisible('current')} icon={LockClosedIcon} />
            <PasswordField label="New password" placeholder="Enter new password" value={password} onChange={setPassword} visible={visible.password} onToggle={() => toggleVisible('password')} icon={KeyIcon} />
            <PasswordField label="Confirm new password" placeholder="Confirm new password" value={passwordConfirm} onChange={setPasswordConfirm} visible={visible.confirm} onToggle={() => toggleVisible('confirm')} icon={ShieldCheckIcon} />

            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500">
                <span>Password Strength</span>
                <span className={strength > 2 ? 'text-teal-700' : strength > 1 ? 'text-amber-700' : 'text-rose-700'}>{strengthLabel(strength)}</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(item => (
                  <span key={item} className={`h-2 ${item <= strength ? strengthColor(strength) : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <Link to="/dashboard" className="inline-flex h-11 items-center border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50">
                Cancel
              </Link>
              <button disabled={loading} className="inline-flex h-11 items-center bg-teal-600 px-5 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.18)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </section>

        <aside className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
          <SecurityCard title="Password Rules" items={['Use at least 8 characters', 'Mix uppercase, numbers and symbols', 'Avoid reusing old passwords']} />
          <SecurityCard title="Account Safety" items={['Never share your password', 'Change it after suspicious activity', 'Use a private device for HR actions']} />
        </aside>
      </div>
    </div>
  );
}

function PasswordField({ label, placeholder, value, onChange, visible, onToggle, icon: Icon }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      <div className="relative">
        {React.createElement(Icon, { className: 'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' })}
        <input
          required
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          className={inputClass}
        />
        <button type="button" onClick={onToggle} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-slate-500 ">
          {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}

function SecurityCard({ title, items }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-indigo-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_58%,#c7d2fe_100%)] p-5 shadow-[0_18px_38px_rgba(67,56,202,0.10)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-300" />
      <p className="text-sm font-black uppercase text-indigo-700">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function strengthLabel(score) {
  if (!score) return 'Empty';
  if (score <= 1) return 'Weak';
  if (score <= 2) return 'Medium';
  return 'Strong';
}

function strengthColor(score) {
  if (score <= 1) return 'bg-rose-500';
  if (score <= 2) return 'bg-amber-400';
  return 'bg-teal-600';
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
