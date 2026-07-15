import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BanknotesIcon, BriefcaseIcon, BuildingOffice2Icon, CalendarDaysIcon,
  ChartBarSquareIcon, ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon,
  DocumentTextIcon, FolderOpenIcon, HomeIcon, IdentificationIcon,
  PaintBrushIcon, Squares2X2Icon, UserGroupIcon, UsersIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';

const navigation = [
  { label: 'Overview', items: [
    ['Dashboard', '/dashboard', HomeIcon, [1, 2, 3, 4]],
    ['My HR', '/my-hr', IdentificationIcon, [1, 2, 3, 4]],
  ]},
  { label: 'Workforce', items: [
    ['Employees', '/employees', UsersIcon, [1, 2]],
    ['Departments', '/departments', BuildingOffice2Icon, [1, 2]],
    ['Attendance', '/attendances', ClockIcon, [1, 2, 3, 4]],
    ['Leaves', '/leaves', CalendarDaysIcon, [1, 2, 3, 4]],
    ['Calendar', '/calendar', CalendarDaysIcon, [1, 2, 3, 4]],
  ]},
  { label: 'People Operations', items: [
    ['Tasks', '/tasks', ClipboardDocumentCheckIcon, [1, 2, 3]],
    ['My Tasks', '/my-tasks', ClipboardDocumentCheckIcon, [4]],
    ['Talent & Lifecycle', '/talent', BriefcaseIcon, [1, 2, 3]],
    ['Employee Services', '/employee-services', Squares2X2Icon, [1, 2, 3, 4]],
    ['Documents', '/documents', FolderOpenIcon, [1, 2]],
  ]},
  { label: 'Management', items: [
    ['Payroll', '/payrolls', BanknotesIcon, [1, 2, 3, 4]],
    ['Compensation', '/compensation', BanknotesIcon, [1, 2]],
    ['Reports', '/reports', ChartBarSquareIcon, [1, 2, 3]],
    ['Bulk Operations', '/bulk-attendance', DocumentTextIcon, [1, 2]],
    ['Operations', '/operations', UserGroupIcon, [1, 2, 3]],
    ['Administration', '/administration', Cog6ToothIcon, [1, 2]],
    ['Site Settings', '/site-settings', PaintBrushIcon, [1]],
  ]},
];

function SidebarContent({ user, close, settings }) {
  const roleId = Number(user?.role_id || 4);
  return <div className="flex h-full flex-col bg-[#0f2137] text-white">
    <div className="flex min-h-[86px] shrink-0 items-center border-b border-white/10 px-5">
      {settings.logo_url ? (
        <img src={settings.logo_url} alt={settings.site_name || 'Site logo'} className="max-h-14 max-w-full object-contain object-left" />
      ) : (
        <p className="min-w-0 truncate text-xl font-bold leading-6">{settings.site_name || 'PeopleOS'}</p>
      )}
    </div>
    <nav className="sidebar-scroll flex-1 overflow-y-auto px-4 py-6">
      {navigation.map(group => {
        const visible = group.items.filter(item => item[3].includes(roleId));
        if (!visible.length) return null;
        return <div key={group.label} className="mb-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase text-cyan-100/50">{group.label}</p>
          <div className="space-y-1.5">{visible.map(([name, href, icon]) => <NavLink key={href} to={href} onClick={close} className={({isActive}) => `group flex min-h-[46px] items-center gap-3 border px-4 py-3 text-sm font-medium transition-all ${isActive ? 'border-teal-300/60 bg-teal-400 text-[#0f2137] shadow-md shadow-teal-950/20' : 'border-transparent text-cyan-50/80 hover:border-white/10 hover:bg-white/[0.08] hover:text-white'}`}>
            {React.createElement(icon, { className: 'h-5 w-5 shrink-0 transition-colors group-hover:text-white' })}<span className="truncate">{name}</span>
          </NavLink>)}</div>
        </div>;
      })}
    </nav>
  </div>;
}

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  return <>
    <aside className="hidden h-screen w-72 shrink-0 lg:block"><SidebarContent user={user} settings={settings}/></aside>
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button aria-label="Close sidebar" onClick={() => setOpen(false)} className={`absolute inset-0 bg-slate-950/55 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}/>
      <aside className={`relative h-full w-[min(21rem,88vw)] shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent user={user} settings={settings} close={() => setOpen(false)}/>
        <button aria-label="Close navigation" onClick={() => setOpen(false)} className="absolute right-3 top-6 flex h-9 w-9 items-center justify-center text-cyan-50/70 hover:bg-white/10 hover:text-white"><XMarkIcon className="h-5 w-5"/></button>
      </aside>
    </div>
  </>;
}
