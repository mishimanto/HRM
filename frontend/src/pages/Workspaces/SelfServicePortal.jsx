import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import {
  ArrowDownTrayIcon,
  ArrowLeftStartOnRectangleIcon,
  ArrowPathIcon,
  ArrowRightEndOnRectangleIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  IdentificationIcon,
  MegaphoneIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { selfService } from '../../services/selfService';
import { documentService } from '../../services/documentService';
import SharedStatCard from '../../components/UI/StatCard';
import { promptDialog } from '../../utils/dialog';

const tabs = [
  ['overview', 'Overview', RectangleGroupIcon],
  ['attendance', 'Attendance', CalendarDaysIcon],
  ['leave_balances', 'Leave', SparklesIcon],
  ['payslips', 'Payslips', BanknotesIcon],
  ['expenses', 'Expenses', BriefcaseIcon],
  ['tasks', 'Tasks', ClipboardDocumentCheckIcon],
  ['training', 'Learning', ShieldCheckIcon],
  ['assets', 'Assets', IdentificationIcon],
  ['documents', 'Documents', DocumentTextIcon],
  ['surveys', 'Surveys', MegaphoneIcon],
];

const statusStyles = {
  approved: 'bg-teal-50 text-teal-700 border-teal-200',
  paid: 'bg-teal-50 text-teal-700 border-teal-200',
  completed: 'bg-teal-50 text-teal-700 border-teal-200',
  active: 'bg-teal-50 text-teal-700 border-teal-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SelfServicePortal() {
  const [active, setActive] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData((await selfService.overview()).data);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load self service');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const attendance = async action => {
    setMessage('');
    setError('');
    try {
      const response = await selfService[action]();
      setMessage(response.data.message);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Attendance action failed');
    }
  };

  const answerSurvey = async survey => {
    const question = survey.questions?.[0];
    const answer = await promptDialog({
      title: survey.title || 'Submit survey response',
      inputLabel: question?.question || 'Your response',
      inputPlaceholder: 'Write your response',
      confirmButtonText: 'Submit response',
    });
    if (answer === null) return;
    setMessage('');
    setError('');
    try {
      await selfService.respondSurvey(survey.id, { [question?.id || 'response']: answer });
      setMessage('Survey submitted');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Survey submission failed');
    }
  };

  const rows = active === 'overview' ? [] : data[active] || [];
  const totalLeave = useMemo(
    () => (data.leave_balances || []).reduce((sum, item) => sum + Number(item.available || 0), 0).toFixed(1),
    [data.leave_balances]
  );

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black">My HR</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button title="Refresh" onClick={load} className="flex h-10 w-10 items-center justify-center border border-white/20 bg-white/10 text-white shadow-lg shadow-slate-950/10 hover:bg-white/15">
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            {!data.today_attendance?.check_in && (
              <button onClick={() => attendance('checkIn')} className="flex h-10 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-[#0f2137] shadow-[0_14px_26px_rgba(20,184,166,0.28)] hover:bg-teal-300">
                <ArrowRightEndOnRectangleIcon className="h-4 w-4" />
                Check in
              </button>
            )}
            {data.today_attendance?.check_in && !data.today_attendance?.check_out && (
              <button onClick={() => attendance('checkOut')} className="flex h-10 items-center gap-2 bg-amber-300 px-4 text-sm font-black text-[#0f2137] shadow-[0_14px_26px_rgba(245,158,11,0.24)] hover:bg-amber-200">
                <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
                Check out
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <ToastAlert type="success" message={message} />}
      {error && <ToastAlert type="error" message={error} />}

      <div className="sidebar-scroll flex gap-2 overflow-x-auto border border-white/70 bg-white/90 p-1 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur">
        {tabs.map(([key, label, TabIcon]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex min-h-11 min-w-max items-center gap-2 border px-4 py-2 text-sm font-semibold transition ${
              active === key
                ? 'border-teal-300 bg-teal-600 text-white shadow-[0_10px_20px_rgba(15,118,110,0.20)]'
                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {React.createElement(TabIcon, { className: 'h-4 w-4' })}
            {label}
          </button>
        ))}
      </div>

      {active === 'overview' ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Today" value={data.today_attendance?.status || 'Not marked'} icon={CalendarDaysIcon} theme="teal" />
            <Metric label="Leave available" value={`${totalLeave} days`} icon={SparklesIcon} theme="amber" />
            <Metric label="Open tasks" value={data.tasks?.length || 0} icon={ClipboardDocumentCheckIcon} theme="indigo" />
            <Metric label="Active assets" value={data.assets?.length || 0} icon={IdentificationIcon} theme="rose" />
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur xl:col-span-3">
              <div className="p-4 bg-slate-100 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Announcements</h2>
                </div>
                <span className="flex items-center justify-center"><MegaphoneIcon className="h-5 w-5" /></span>
              </div>
              <div className="divide-y p-4 divide-slate-100">
                {(data.announcements || []).length === 0 ? (
                  <EmptyState label="No announcements available." />
                ) : (
                  data.announcements.map(item => (
                    <article key={item.id} className="py-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur xl:col-span-2">
              <div className="p-4 bg-slate-100 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Profile</h2>
                </div>
                <span className="flex items-center justify-center"><IdentificationIcon className="h-5 w-5" /></span>
              </div>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 p-4">
                <Info label="Employee" value={data.profile?.user?.name} />
                <Info label="Employee ID" value={data.profile?.user?.employee_id || data.profile?.employee_id} />
                <Info label="Department" value={data.profile?.department?.name} />
                <Info label="Position" value={data.profile?.position?.title} />
                <Info label="Joining date" value={data.profile?.joining_date?.slice(0, 10)} />
                <Info label="Employment" value={data.profile?.employment_type} />
              </dl>
            </section>
          </div>
        </>
      ) : (
        <RecordTable rows={rows} type={active} onSurvey={answerSurvey} />
      )}
    </div>
  );
}

function Metric({ label, value, icon, theme }) {
  return <SharedStatCard label={label} value={value} icon={icon} theme={theme} />;
}

function Info({ label, value }) {
  return (
    <div className="border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-3 shadow-sm">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 truncate font-semibold text-slate-900">{value || '-'}</dd>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex p-10 flex-col items-center justify-center text-center text-slate-500">
      <DocumentTextIcon className="mb-3 h-10 w-10 text-slate-300" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

function RecordTable({ rows, type, onSurvey }) {
  const hasActions = ['documents', 'surveys', 'payslips'].includes(type);
  const title = tabs.find(tab => tab[0] === type)?.[1] || 'Records';

  return (
    <section className="overflow-hidden border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
        <span className="border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">{rows.length} records</span>
      </div>

      <div className="min-h-64 overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState label="No records available." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/90 text-left text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Record</th>
                <th className="px-5 py-3">Date / Detail</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Status</th>
                {hasActions && <th className="px-5 py-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(record => (
                <tr key={record.id} className="transition hover:bg-teal-50/40">
                  <td className="px-5 py-4 font-semibold text-slate-900">{recordTitle(record)}</td>
                  <td className="px-5 py-4 text-slate-600">{recordDate(record)}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{recordValue(record, type)}</td>
                  <td className="px-5 py-4"><StatusBadge value={record.status || record.run_status || 'Active'} /></td>
                  {hasActions && <td className="px-5 py-4"><RecordAction record={record} type={type} onSurvey={onSurvey} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function recordTitle(record) {
  return record.name || record.title || record.run_name || record.claim_number || record.file_name || record.code || `#${record.id}`;
}

function recordDate(record) {
  return (record.date || record.payment_date || record.expense_date || record.due_date || record.created_at || '').slice(0, 10) || '-';
}

function recordValue(record, type) {
  if (type === 'payslips') return `BDT ${Number(record.net_pay || 0).toLocaleString()}`;
  if (type === 'leave_balances') return `${record.available} days`;
  return record.category || record.check_in || record.duration_hours || record.asset_tag || '-';
}

function StatusBadge({ value }) {
  const normalized = String(value || 'active').toLowerCase();
  const style = statusStyles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{normalized.replace('_', ' ')}</span>;
}

function RecordAction({ record, type, onSurvey }) {
  if (type === 'documents') {
    return (
      <button onClick={() => documentService.download(record.id, record.file_name)} className="inline-flex items-center gap-2 border border-teal-200 bg-teal-50 px-2.5 py-1 text-sm font-bold text-teal-700 hover:bg-teal-100 hover:text-teal-900">
        <ArrowDownTrayIcon className="h-4 w-4" />
        Download
      </button>
    );
  }
  if (type === 'surveys') {
    return <button onClick={() => onSurvey(record)} className="border border-teal-200 bg-teal-50 px-2.5 py-1 text-sm font-bold text-teal-700 hover:bg-teal-100 hover:text-teal-900">Respond</button>;
  }
  if (type === 'payslips') {
    return <button onClick={() => selfService.downloadPayslip(record.id)} className="border border-teal-200 bg-teal-50 px-2.5 py-1 text-sm font-bold text-teal-700 hover:bg-teal-100 hover:text-teal-900">PDF</button>;
  }
  return null;
}
