import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  TableCellsIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { operationsService } from '../../services/operationsService';

const exportTypes = [
  { key: 'employees', label: 'Employees', icon: UserGroupIcon, description: 'Master employee profile records' },
  { key: 'attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon, description: 'Daily time and attendance logs' },
  { key: 'payroll', label: 'Payroll', icon: TableCellsIcon, description: 'Payroll items and salary amounts' },
];

const statusTone = status => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved' || value === 'completed') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (value === 'pending' || value === 'processing') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (value === 'rejected' || value === 'failed') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-indigo-200 bg-indigo-50 text-indigo-800';
};

const prettyDate = value => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function OperationsWorkspace() {
  const [approvals, setApprovals] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [message, setMessage] = useState(null);
  const [file, setFile] = useState(null);
  const [busyAction, setBusyAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [approvalResponse, importResponse] = await Promise.all([
        operationsService.approvals(),
        operationsService.importHistory(),
      ]);
      setApprovals(approvalResponse.data.data || []);
      setImports(importResponse.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to load operations data' });
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => ({
    approvals: approvals.length,
    pending: approvals.filter(item => item.status === 'pending').length,
    imports: imports.length,
    failedImports: imports.filter(item => item.status === 'failed' || Number(item.failed_rows || 0) > 0).length,
  }), [approvals, imports]);

  const act = async (id, status) => {
    setBusyAction(`${id}-${status}`);
    setMessage(null);
    try {
      await operationsService.act(id, status);
      setMessage({ type: 'success', text: `Request ${status}.` });
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Approval action failed' });
    } finally {
      setBusyAction('');
    }
  };

  const upload = async () => {
    if (!file) return;
    setBusyAction('upload');
    setMessage(null);
    try {
      const response = await operationsService.importEmployees(file);
      setMessage({ type: 'success', text: `${response.data.processed} employees imported, ${response.data.failed} failed.` });
      setFile(null);
      await load();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Employee import failed' });
    } finally {
      setBusyAction('');
    }
  };

  const download = async type => {
    setBusyAction(`export-${type}`);
    setMessage(null);
    try {
      await operationsService.downloadExport(type);
      setMessage({ type: 'success', text: `${type} export is ready.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Export failed' });
    } finally {
      setBusyAction('');
    }
  };

  if (loading && !hasLoaded) {
    return <PageLoadingBlock label="Loading operations..." />;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">Operations Center</h1>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex h-11 w-fit items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <Alert type={message.type} message={message.text} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Approval Inbox" value={summary.approvals} icon={QueueListIcon} theme="teal" subtitle={`${summary.pending} pending`} />
        <SummaryCard label="Pending Actions" value={summary.pending} icon={ClockIcon} theme="amber" subtitle="Awaiting decision" />
        <SummaryCard label="Import Jobs" value={summary.imports} icon={ArrowUpTrayIcon} theme="indigo" subtitle="Latest 100 records" />
        <SummaryCard label="Import Issues" value={summary.failedImports} icon={ExclamationTriangleIcon} theme="rose" subtitle="Failed or partial" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Approval Inbox</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase text-amber-800">
            <ClockIcon className="h-4 w-4" />
            {summary.pending} pending
          </span>
        </div>

        {loading ? (
          <LoadingBlock label="Loading approvals..." />
        ) : approvals.length === 0 ? (
          <EmptyBlock icon={CheckCircleIcon} title="No approval requests waiting" text="Your operational approval inbox is clear." />
        ) : (
          <div className="divide-y divide-slate-100">
            {approvals.map(approval => (
              <div key={approval.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-teal-50/35 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">{approval.approvable_type?.split('\\').pop() || 'Request'} #{approval.approvable_id}</p>
                    <StatusBadge status={approval.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Requested by {approval.requester?.name || 'Employee'} · step {approval.step || 1} · assigned to {approval.approver?.name || 'Approver'}
                  </p>
                </div>
                {approval.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <IconButton title="Reject" tone="rose" disabled={busyAction === `${approval.id}-rejected`} onClick={() => act(approval.id, 'rejected')} icon={XMarkIcon} />
                    <IconButton title="Approve" tone="teal" disabled={busyAction === `${approval.id}-approved`} onClick={() => act(approval.id, 'approved')} icon={CheckIcon} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <PanelHeader title="Export Data" subtitle="Download operational records in CSV format." icon={DocumentArrowDownIcon} />
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {exportTypes.map(item => (
              <button key={item.key} type="button" onClick={() => download(item.key)} disabled={busyAction === `export-${item.key}`} className="group relative overflow-hidden border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{item.label}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.description}</p>
                  </div>
                  {React.createElement(item.icon, { className: 'h-6 w-6 shrink-0 text-teal-700 transition-transform group-hover:-translate-y-0.5' })}
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase text-teal-700">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <PanelHeader title="Employee Import" subtitle="Upload a CSV file to create employee records in batch." icon={ArrowUpTrayIcon} />
          <div className="space-y-4 p-5">
            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Required columns: employee_id, name, email, phone, joining_date.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex min-h-12 flex-1 cursor-pointer items-center border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 hover:border-teal-300 hover:bg-teal-50">
                <input type="file" accept=".csv,text/csv" onChange={event => setFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-sm" />
              </label>
              <button type="button" disabled={!file || busyAction === 'upload'} onClick={upload} className="inline-flex h-12 items-center justify-center gap-2 bg-teal-600 px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.18)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                <ArrowUpTrayIcon className="h-4 w-4" />
                {busyAction === 'upload' ? 'Importing...' : 'Import'}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric label="Selected File" value={file?.name || 'No file selected'} />
              <MiniMetric label="Accepted Format" value="CSV / TXT" />
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Import History</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black uppercase text-indigo-800">
            <ArrowUpTrayIcon className="h-4 w-4" />
            {imports.length} jobs
          </span>
        </div>
        {loading ? (
          <LoadingBlock label="Loading import history..." />
        ) : imports.length === 0 ? (
          <EmptyBlock icon={ArrowUpTrayIcon} title="No import jobs recorded" text="Uploaded employee files will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">File</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Processed</th>
                  <th className="px-5 py-3">Failed</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/70">
                {imports.map(item => (
                  <tr key={item.id} className="hover:bg-teal-50/35">
                    <td className="max-w-sm px-5 py-4 font-bold text-slate-900">
                      <span className="block truncate">{item.file_path}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4 text-slate-700">{item.processed_rows || 0}/{item.total_rows || 0}</td>
                    <td className="px-5 py-4 font-black text-rose-700">{item.failed_rows || 0}</td>
                    <td className="px-5 py-4 text-slate-500">{prettyDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function PanelHeader({ title, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-gray-100 px-5 py-4">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      <div className="flex shrink-0 items-center justify-center">
        {React.createElement(Icon, { className: 'h-5 w-5' })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-black capitalize ${statusTone(status)}`}>
      {String(status || 'active').replace('_', ' ')}
    </span>
  );
}

function IconButton({ title, tone, disabled, onClick, icon: Icon }) {
  const styles = tone === 'rose'
    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
    : 'border-teal-200 bg-teal-600 text-white hover:bg-teal-700';

  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={`flex h-10 w-10 items-center justify-center border disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}>
      {React.createElement(Icon, { className: 'h-5 w-5' })}
    </button>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function LoadingBlock({ label }) {
  return (
    <div className="flex min-h-56 items-center justify-center">
      <div className="text-center">
        <div className="professional-loader mx-auto" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function PageLoadingBlock({ label }) {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <div className="text-center">
        <div className="professional-loader mx-auto" />
        <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, text }) {
  return (
    <div className="px-5 py-14 text-center">
      {React.createElement(Icon, { className: 'mx-auto h-12 w-12 text-slate-300' })}
      <p className="mt-3 text-base font-black text-slate-700">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
