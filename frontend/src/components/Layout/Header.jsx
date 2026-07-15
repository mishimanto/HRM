import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronDownIcon,
  LockClosedIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './Notifications/NotificationBell';

const pageNames = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  attendances: 'Attendance',
  leaves: 'Leave Management',
  payrolls: 'Payroll',
  departments: 'Departments',
  reports: 'Reports',
  calendar: 'Calendar',
  tasks: 'Task Management',
  talent: 'Talent & Lifecycle',
  'employee-services': 'Employee Services',
  operations: 'Operations Center',
  compensation: 'Compensation',
  administration: 'HR Administration',
  'site-settings': 'Site Settings',
  'my-hr': 'My HR',
  documents: 'Documents',
  'bulk-attendance': 'Bulk Attendance',
  'my-tasks': 'My Tasks',
  notifications: 'Notifications',
};

const getUserImage = user => (
  user?.profile_photo_url
  || user?.profile_image_url
  || user?.avatar_url
  || user?.photo_url
  || user?.employee?.profile_photo_url
  || user?.employee?.profile_image_url
  || user?.employee?.avatar_url
  || user?.employee?.photo_url
  || null
);

export default function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const ref = useRef(null);
  const segment = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const title = pageNames[segment] || 'HR Workspace';
  const rawUserImage = getUserImage(user);
  const userImage = imageFailed ? null : rawUserImage;

  useEffect(() => {
    setImageFailed(false);
  }, [rawUserImage]);

  useEffect(() => {
    const close = event => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return (
    <header className="relative z-30 min-h-[76px] shrink-0 border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:px-6">
      <div className="flex min-h-[76px] items-center gap-4">
        <button
          aria-label="Open navigation"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 lg:hidden"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <div className="min-w-0 border-l-4 border-teal-500 pl-4">
          <p className="truncate text-xl font-semibold leading-6 text-slate-950">{title}</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-800 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <NotificationBell />

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(value => !value)}
              aria-expanded={open}
              className="flex min-h-11 items-center gap-2 border border-slate-200 bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-teal-300 hover:bg-slate-50 sm:px-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden bg-teal-600 text-white shadow-sm">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={user?.name || 'User'}
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="h-6 w-6" />
                )}
              </span>
              <span className="hidden max-w-44 sm:block">
                <span className="block truncate text-sm font-semibold text-slate-900">{user?.name}</span>
              </span>
              <ChevronDownIcon className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-14 w-60 border border-slate-200 bg-white py-2 shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.role?.name || 'Employee'}</p>
                </div>
                <Link
                  to="/profile/edit"
                  onClick={() => setOpen(false)}
                  className="mx-2 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Edit profile
                </Link>
                <Link
                  to="/profile/change-password"
                  onClick={() => setOpen(false)}
                  className="mx-2 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-800"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  Change password
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="mx-2 mt-1 flex w-[calc(100%-1rem)] items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
