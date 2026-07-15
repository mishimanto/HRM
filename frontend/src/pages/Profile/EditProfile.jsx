import React, { useEffect, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  IdentificationIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const fieldClass = 'h-12 w-full border border-slate-200 bg-slate-50 pl-11 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100';

export default function EditProfile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
      });
    }
  }, [user]);

  const handleChange = event => {
    setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      const response = await authService.updateProfile(form);
      if (refreshUser) await refreshUser();
      setNotice({ type: 'success', message: response.message || 'Profile updated successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[4px] bg-teal-400 text-slate-950 shadow-[0_14px_28px_rgba(20,184,166,0.28)]">
              <UserCircleIcon className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Edit Profile</h1>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Personal Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:grid-cols-2">
            <InputField icon={IdentificationIcon} label="Name" name="name" placeholder="Enter your name" value={form.name} onChange={handleChange} required />
            <InputField icon={EnvelopeIcon} label="Email" name="email" type="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
            <InputField icon={PhoneIcon} label="Phone" name="phone" placeholder="Enter your phone number" value={form.phone} onChange={handleChange} />
            <InputField icon={CalendarDaysIcon} label="Date of birth" name="date_of_birth" type="date" placeholder="Select your date of birth" value={form.date_of_birth} onChange={handleChange} />
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">Address</span>
              <div className="relative">
                <HomeIcon className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="4"
                  className="w-full resize-none border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                />
              </div>
            </label>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 sm:col-span-2">
              <Link to="/dashboard" className="inline-flex h-11 items-center border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50">
                Cancel
              </Link>
              <button disabled={loading} className="inline-flex h-11 items-center bg-teal-600 px-5 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.18)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <InfoCard title="Profile Sync" text="After saving, the header and account menu refresh with your latest information." />
          <InfoCard title="HR Visibility" text="Name, phone, email and address can be used by HR teams for employee communication." />
        </aside>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      <div className="relative">
        {React.createElement(Icon, { className: 'pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400' })}
        <input {...props} className={fieldClass} />
      </div>
    </label>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-teal-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_58%,#ccfbf1_100%)] p-5 shadow-[0_18px_38px_rgba(15,118,110,0.10)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-300" />
      <p className="text-sm font-black uppercase text-teal-700">{title}</p>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
