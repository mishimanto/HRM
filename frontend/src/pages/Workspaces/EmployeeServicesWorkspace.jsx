import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowPathIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { employeeServices } from '../../services/workspaceService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';

const tabs = [
  ['expenses', 'Expenses'],
  ['assets', 'Assets'],
  ['asset_assignments', 'Assignments'],
  ['benefits', 'Benefits'],
  ['benefit_enrollments', 'Benefit enrollments'],
  ['grievances', 'Cases'],
  ['announcements', 'Announcements'],
  ['surveys', 'Surveys'],
];

const managerConfigs = {
  assets: 'Register asset',
  asset_assignments: 'Assign asset',
  benefits: 'Create benefit',
  benefit_enrollments: 'Enroll benefit',
  announcements: 'Publish announcement',
  surveys: 'Create survey',
};

const statusTone = status => {
  const value = String(status || 'active').toLowerCase();
  if (value.includes('reject') || value.includes('cancel') || value.includes('damaged')) return 'border-rose-200 bg-rose-50 text-rose-800';
  if (value.includes('submitted') || value.includes('pending') || value.includes('important') || value.includes('urgent')) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (value.includes('approved') || value.includes('reimbursed') || value.includes('available') || value.includes('active')) return 'border-teal-200 bg-teal-50 text-teal-800';
  return 'border-indigo-200 bg-indigo-50 text-indigo-800';
};

const tabLabel = key => tabs.find(tab => tab[0] === key)?.[1] || 'Records';

export default function EmployeeServicesWorkspace() {
  const { user } = useAuth();
  const canManage = [1, 2].includes(user?.role_id);
  const [active, setActive] = useState('expenses');
  const [data, setData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, employeeResponse] = await Promise.all([
        employeeServices.overview(),
        canManage ? employeeService.getAll() : Promise.resolve({ data: { data: [] } }),
      ]);
      setData(overview.data || {});
      setEmployees(employeeResponse.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load employee services');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const title = active === 'expenses' ? 'Submit expense' : active === 'grievances' ? 'Open case' : managerConfigs[active];
  const rows = data[active] || [];

  const summary = useMemo(() => ({
    expenses: (data.expenses || []).length,
    approvedAmount: (data.expenses || []).filter(row => ['approved', 'reimbursed'].includes(row.status)).reduce((sum, row) => sum + Number(row.amount || 0), 0),
    assignedAssets: (data.asset_assignments || []).filter(row => !row.returned_at).length,
    announcements: (data.announcements || []).length,
  }), [data]);

  const submit = async event => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (active === 'expenses') await employeeServices.createExpense({ ...v, amount: Number(v.amount) });
      if (active === 'grievances') await employeeServices.createGrievance(v);
      if (active === 'assets') await employeeServices.createAsset(v);
      if (active === 'asset_assignments') await employeeServices.assignAsset({ asset_id: Number(v.asset_id), employee_id: Number(v.employee_id), assigned_at: v.assigned_at, expected_return_at: v.expected_return_at || null, condition_on_issue: v.condition_on_issue, notes: v.notes });
      if (active === 'benefits') await employeeServices.createBenefit({ ...v, employee_contribution: Number(v.employee_contribution || 0), employer_contribution: Number(v.employer_contribution || 0) });
      if (active === 'benefit_enrollments') await employeeServices.enrollBenefit({ benefit_plan_id: Number(v.benefit_plan_id), employee_id: Number(v.employee_id), enrolled_at: v.enrolled_at });
      if (active === 'announcements') await employeeServices.createAnnouncement(v);
      if (active === 'surveys') await employeeServices.createSurvey({ title: v.title, description: v.description, is_anonymous: v.is_anonymous === 'true', opens_at: v.opens_at, closes_at: v.closes_at, status: 'active', questions: [{ question: v.question, type: v.question_type, is_required: true }] });
      setModal(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to save');
    }
  };

  const closeAction = async row => {
    try {
      if (active === 'expenses') await employeeServices.updateExpense(row.id, 'reimbursed');
      if (active === 'asset_assignments') await employeeServices.returnAsset(row.id, { returned_at: new Date().toISOString().slice(0, 10), condition_on_return: 'good' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to complete action');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
          <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black">Employee Services</h1>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
        </section>
        <div className="flex min-h-80 items-center justify-center rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="text-center">
            <div className="professional-loader mx-auto" />
            <p className="mt-3 text-sm font-medium text-slate-500">Loading employee services...</p>
          </div>
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
            <h1 className="text-3xl font-black">Employee Services</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Service</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Action</span>
            </div>
            <button title="Refresh" onClick={load} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            {title && (canManage || ['expenses', 'grievances'].includes(active)) && (
              <button onClick={() => setModal(true)} className="inline-flex h-11 items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15">
                <PlusIcon className="h-4 w-4" />
                {title}
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Expense Claims" value={summary.expenses} icon={BanknotesIcon} theme="teal" />
        <SummaryCard label="Approved Value" value={`৳${summary.approvedAmount.toLocaleString()}`} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Assigned Assets" value={summary.assignedAssets} icon={BriefcaseIcon} theme="amber" />
        <SummaryCard label="Announcements" value={summary.announcements} icon={MegaphoneIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Service Workflows</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {rows.length} records
          </span>
        </div>

        <div className="overflow-x-auto border-b border-slate-200/80 bg-white/70">
          <div className="flex min-w-max">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`min-h-12 border-b-2 px-4 py-2 text-sm font-bold transition ${active === key ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
                <span className="ml-2 text-xs text-slate-400">{data[key]?.length || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No records available</h3>
              <p className="mt-1 text-sm text-slate-500">Create a record or switch to another service tab.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90">
                <tr>
                  <HeadCell>Item</HeadCell>
                  <HeadCell>Owner / Type</HeadCell>
                  <HeadCell>Value</HeadCell>
                  <HeadCell>Status</HeadCell>
                  <HeadCell align="right">Action</HeadCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {rows.map(row => (
                  <tr key={row.id} className="transition hover:bg-teal-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex min-w-[220px] items-center">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                          <UserCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{recordTitle(row)}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">#{row.id} · {tabLabel(active)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{row.employee_name || row.category || row.type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">{recordValue(row)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge style={statusTone(row.status || row.priority)}>{row.status || row.priority || 'Active'}</Badge></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><RowAction canManage={canManage} active={active} row={row} closeAction={closeAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modal && (
        <ServiceModal
          title={title}
          active={active}
          data={data}
          employees={employees}
          onClose={() => setModal(false)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function RowAction({ canManage, active, row, closeAction }) {
  if (canManage && active === 'expenses' && row.status === 'approved') return <ActionButton onClick={() => closeAction(row)}>Reimburse</ActionButton>;
  if (canManage && active === 'asset_assignments' && !row.returned_at) return <ActionButton onClick={() => closeAction(row)}>Return</ActionButton>;
  return <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">No action</span>;
}

function ServiceModal({ title, active, data, employees, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          </div>
          <button type="button" title="Close" onClick={onClose} className="flex rounded-full h-10 w-10 items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <ServiceForm type={active} data={data} employees={employees} />
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button className="inline-flex items-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
            <CheckCircleIcon className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function HeadCell({ children, align }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase text-slate-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{String(children).replace('_', ' ')}</span>;
}

function ActionButton({ children, onClick }) {
  return <button onClick={onClick} className="bg-teal-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">{children}</button>;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function Field({ name, label, type = 'text', required = true }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input required={required} name={name} type={type} step={type === 'number' ? '0.01' : undefined} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function Select({ name, label, items }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select required name={name} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        <option value="">Select</option>
        {items.filter(item => item?.id && item?.name).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}

function NativeSelect({ name, label, options }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select name={name} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ServiceForm({ type, data, employees }) {
  const people = employees.map(employee => ({ id: employee.id, name: employee.user?.name })).filter(item => item.id && item.name);

  if (type === 'expenses') return <><Field name="category" label="Category" /><Field name="expense_date" label="Expense date" type="date" /><Field name="amount" label="Amount" type="number" /><Field name="description" label="Description" /></>;
  if (type === 'grievances') return <><NativeSelect name="type" label="Type" options={['grievance', 'harassment', 'safety', 'ethics', 'other']} /><Field name="subject" label="Subject" /><Field name="description" label="Description" /><NativeSelect name="confidentiality" label="Confidentiality" options={['standard', 'confidential', 'anonymous']} /></>;
  if (type === 'assets') return <><Field name="asset_tag" label="Asset tag" /><Field name="name" label="Asset name" /><Field name="category" label="Category" /><Field name="serial_number" label="Serial number" required={false} /></>;
  if (type === 'asset_assignments') return <><Select name="asset_id" label="Asset" items={(data.assets || []).filter(asset => asset.status === 'available')} /><Select name="employee_id" label="Employee" items={people} /><Field name="assigned_at" label="Assigned date" type="date" /><Field name="expected_return_at" label="Expected return" type="date" required={false} /><NativeSelect name="condition_on_issue" label="Condition" options={['new', 'good', 'fair', 'damaged']} /><Field name="notes" label="Notes" required={false} /></>;
  if (type === 'benefits') return <><Field name="name" label="Plan name" /><NativeSelect name="type" label="Type" options={['insurance', 'provident_fund', 'gratuity', 'medical', 'transport', 'meal', 'other']} /><Field name="employee_contribution" label="Employee contribution" type="number" /><Field name="employer_contribution" label="Employer contribution" type="number" /><Field name="effective_from" label="Effective from" type="date" /><Field name="effective_to" label="Effective to" type="date" required={false} /></>;
  if (type === 'benefit_enrollments') return <><Select name="benefit_plan_id" label="Benefit" items={(data.benefits || []).map(item => ({ id: item.id, name: item.name }))} /><Select name="employee_id" label="Employee" items={people} /><Field name="enrolled_at" label="Enrollment date" type="date" /></>;
  if (type === 'announcements') return <><Field name="title" label="Title" /><Field name="body" label="Message" /><NativeSelect name="priority" label="Priority" options={['normal', 'important', 'urgent']} /><Field name="published_at" label="Publish at" type="datetime-local" /></>;
  return <><Field name="title" label="Survey title" /><Field name="description" label="Description" /><Field name="opens_at" label="Opens" type="datetime-local" /><Field name="closes_at" label="Closes" type="datetime-local" /><NativeSelect name="is_anonymous" label="Anonymous" options={['false', 'true']} /><Field name="question" label="First question" /><NativeSelect name="question_type" label="Question type" options={['text', 'rating', 'boolean']} /></>;
}

function recordTitle(row) {
  return row.title || row.subject || row.name || row.asset_name || row.benefit_name || row.asset_tag || row.claim_number || `#${row.id}`;
}

function recordValue(row) {
  if (row.amount) return `৳${Number(row.amount).toLocaleString()}`;
  return row.priority || row.asset_tag || row.category || '-';
}
