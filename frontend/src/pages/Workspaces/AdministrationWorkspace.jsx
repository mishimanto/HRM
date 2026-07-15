import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { administrationService } from '../../services/administrationService';

const tabs = [
  ['companies', 'Company'],
  ['branches', 'Branches'],
  ['shifts', 'Shifts'],
  ['holidays', 'Holidays'],
  ['leave_types', 'Leave policies'],
  ['approval_workflows', 'Approvals'],
  ['integrations', 'Integrations'],
  ['integration_deliveries', 'Delivery log'],
  ['roles', 'Roles & permissions'],
];

const tabIcons = {
  companies: BuildingOffice2Icon,
  branches: Squares2X2Icon,
  shifts: ClockIcon,
  holidays: CalendarDaysIcon,
  leave_types: SparklesIcon,
  approval_workflows: CheckCircleIcon,
  integrations: LinkIcon,
  integration_deliveries: ArrowPathIcon,
  roles: ShieldCheckIcon,
};

const forms = {
  branches: [['company_id', 'Company', 'company'], ['name', 'Name'], ['code', 'Code'], ['phone', 'Phone']],
  holidays: [['company_id', 'Company', 'company'], ['name', 'Holiday name'], ['date', 'Date', 'date'], ['type', 'Type', 'select', 'government,festival,company,optional']],
  shifts: [['company_id', 'Company', 'company'], ['name', 'Shift name'], ['code', 'Code'], ['starts_at', 'Starts', 'time'], ['ends_at', 'Ends', 'time'], ['standard_minutes', 'Standard minutes', 'number']],
  leave_types: [['company_id', 'Company', 'company'], ['name', 'Leave name'], ['code', 'Code'], ['annual_entitlement', 'Annual entitlement', 'number'], ['accrual_frequency', 'Accrual', 'select', 'none,monthly,quarterly,yearly'], ['accrual_amount', 'Accrual amount', 'number']],
};

const statusTone = status => {
  const value = String(status || '').toLowerCase();
  if (value === 'active' || value === 'delivered' || value === 'success') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (value === 'pending' || value === 'processing') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (value === 'failed' || value === 'inactive') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-indigo-200 bg-indigo-50 text-indigo-800';
};

const currentTabLabel = active => tabs.find(tab => tab[0] === active)?.[1] || 'Records';

export default function AdministrationWorkspace() {
  const [active, setActive] = useState('companies');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      setData((await administrationService.overview()).data || {});
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to load administration data' });
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data[active] || [];
  const summary = useMemo(() => ({
    companies: (data.companies || []).length,
    policies: (data.shifts || []).length + (data.holidays || []).length + (data.leave_types || []).length,
    roles: (data.roles || []).length,
    integrations: (data.integrations || []).length,
    failedDeliveries: (data.integration_deliveries || []).filter(item => item.status === 'failed').length,
  }), [data]);

  const closeModal = () => {
    setModal(false);
    setEditingRole(null);
  };

  const submit = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form);
    setSaving(true);
    setNotice(null);

    try {
      if (editingRole) {
        const permissions = form.getAll('permissions');
        await administrationService.updateRole(editingRole.id, {
          name: editingRole.name,
          slug: editingRole.slug,
          permissions,
          is_active: true,
        });
      } else if (active === 'companies') {
        await administrationService.createCompany({
          ...raw,
          currency: 'BDT',
          timezone: 'Asia/Dhaka',
          settings: {
            provident_fund_employee_rate: Number(raw.pf_employee || 0),
            provident_fund_employer_rate: Number(raw.pf_employer || 0),
            gratuity_days_per_year: Number(raw.gratuity_days || 30),
            overtime_multiplier: Number(raw.overtime_multiplier || 2),
          },
        });
      } else if (active === 'approval_workflows') {
        await administrationService.createApprovalWorkflow({
          company_id: raw.company_id ? Number(raw.company_id) : null,
          name: raw.name,
          module: raw.module,
          steps: [{ approver_type: raw.approver_type, role_id: raw.role_id ? Number(raw.role_id) : null }],
        });
      } else if (active === 'integrations') {
        await administrationService.createIntegration({
          company_id: raw.company_id ? Number(raw.company_id) : null,
          name: raw.name,
          url: raw.url,
          secret: raw.secret,
          events: raw.events.split(',').map(item => item.trim()).filter(Boolean),
        });
      } else {
        const values = { ...raw };
        ['company_id', 'standard_minutes', 'annual_entitlement', 'accrual_amount'].forEach(key => {
          if (values[key] !== '') values[key] = Number(values[key]);
        });
        const actions = { branches: 'createBranch', holidays: 'createHoliday', shifts: 'createShift', leave_types: 'createLeaveType' };
        await administrationService[actions[active]](values);
      }

      setNotice({ type: 'success', message: editingRole ? 'Role permissions updated.' : `${currentTabLabel(active)} saved successfully.` });
      closeModal();
      await load();
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const retry = async id => {
    setNotice(null);
    try {
      await administrationService.retryDelivery(id);
      setNotice({ type: 'success', message: 'Delivery retry queued.' });
      await load();
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to retry delivery' });
    }
  };

  if (loading && !hasLoaded) {
    return <PageLoadingBlock label="Loading administration..." />;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">HR Administration</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" title="Refresh" onClick={load} disabled={loading} className="inline-flex h-11 items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60">
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            {!['roles', 'integration_deliveries'].includes(active) && (
              <button type="button" onClick={() => setModal(true)} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {notice && <Alert type={notice.type} message={notice.message} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Companies" value={summary.companies} icon={BuildingOffice2Icon} theme="teal" />
        <SummaryCard label="Policies" value={summary.policies} icon={CalendarDaysIcon} theme="amber" />
        <SummaryCard label="Roles" value={summary.roles} icon={ShieldCheckIcon} theme="indigo"  />
        <SummaryCard label="Integration Issues" value={summary.failedDeliveries} icon={ExclamationTriangleIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="grid gap-px bg-slate-200/70 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-9">
          {tabs.map(([key, label]) => (
            <TabButton key={key} label={label} active={active === key} count={(data[key] || []).length} icon={tabIcons[key]} onClick={() => setActive(key)} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{currentTabLabel(active)}</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black uppercase text-teal-800">
            {React.createElement(tabIcons[active] || Squares2X2Icon, { className: 'h-4 w-4' })}
            {rows.length} records
          </span>
        </div>

        {loading ? (
          <LoadingBlock label="Loading policies..." />
        ) : rows.length === 0 ? (
          <EmptyBlock icon={tabIcons[active] || Squares2X2Icon} title="No records configured" text="Add a record to start configuring this administration area." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Code / Date</th>
                  <th className="px-5 py-3">Configuration</th>
                  <th className="px-5 py-3">Status</th>
                  {['roles', 'integration_deliveries'].includes(active) && <th className="px-5 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/70">
                {rows.map(record => (
                  <tr key={record.id} className="hover:bg-teal-50/35">
                    <td className="max-w-xs px-5 py-4 font-bold text-slate-900">
                      <span className="block truncate">{record.name || record.title || record.integration_name || `#${record.id}`}</span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{record.code || record.date?.slice(0, 10) || record.slug || record.module || record.event || '-'}</td>
                    <td className="max-w-xl px-5 py-4 text-slate-600">{recordConfig(record, active)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={active === 'integration_deliveries' ? record.status : record.is_active === false ? 'inactive' : 'active'} />
                    </td>
                    {active === 'roles' && (
                      <td className="px-5 py-4 text-right">
                        <button type="button" onClick={() => setEditingRole(record)} className="inline-flex h-9 items-center border border-indigo-200 bg-indigo-50 px-3 text-xs font-black uppercase text-indigo-700 hover:bg-indigo-100">
                          Edit permissions
                        </button>
                      </td>
                    )}
                    {active === 'integration_deliveries' && (
                      <td className="px-5 py-4 text-right">
                        {record.status === 'failed'
                          ? <button type="button" onClick={() => retry(record.id)} className="inline-flex h-9 items-center border border-rose-200 bg-rose-50 px-3 text-xs font-black uppercase text-rose-700 hover:bg-rose-100">Retry</button>
                          : <span className="text-sm font-semibold text-slate-400">-</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(modal || editingRole) && (
        <AdministrationModal
          active={active}
          data={data}
          editingRole={editingRole}
          saving={saving}
          onClose={closeModal}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function recordConfig(record, active) {
  if (active === 'companies') return `PF ${record.settings?.provident_fund_employee_rate || 0}% · gratuity ${record.settings?.gratuity_days_per_year || 30} days · ${record.timezone || 'Asia/Dhaka'}`;
  if (active === 'roles') return (record.permissions || []).length ? (record.permissions || []).join(', ') : 'No permissions assigned';
  if (active === 'integrations') return `${record.url} · ${(record.events || []).join(', ') || 'No events'}`;
  if (active === 'integration_deliveries') return `Attempt ${record.attempt || 0} · HTTP ${record.response_status || '-'} · ${record.created_at || '-'}`;
  if (record.starts_at) return `${record.starts_at} - ${record.ends_at} · ${record.standard_minutes || 0} minutes`;
  if (record.annual_entitlement != null) return `${record.annual_entitlement} days · ${record.accrual_frequency || 'none'} accrual`;
  return record.type || record.address || record.phone || '-';
}

function AdministrationModal({ active, data, editingRole, saving, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">{editingRole ? `Permissions · ${editingRole.name}` : `Add ${currentTabLabel(active)}`}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {editingRole ? (
            Object.entries(data.permission_catalog || {}).map(([group, permissions]) => (
              <fieldset key={group} className="col-span-full border border-slate-200 bg-slate-50/60 p-4">
                <legend className="px-2 text-sm font-black uppercase text-slate-600">{group}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {permissions.map(permission => (
                    <label key={permission} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" name="permissions" value={permission} defaultChecked={(editingRole.permissions || []).includes('*') || (editingRole.permissions || []).includes(permission)} className="h-4 w-4 accent-teal-600" />
                      {permission}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))
          ) : active === 'approval_workflows' ? (
            <>
              <Field name="name" label="Workflow name" />
              <CompanySelect data={data} />
              <NativeSelect name="module" label="Module" options={['leave', 'expense', 'payroll', 'requisition', 'onboarding', 'offboarding']} />
              <NativeSelect name="approver_type" label="Approver type" options={['manager', 'role']} />
              <label className="col-span-full block">
                <span className="mb-2 block text-xs font-black uppercase text-slate-500">Approver role</span>
                <select name="role_id" className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
                  <option value="">Only for role approver</option>
                  {(data.roles || []).map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </label>
            </>
          ) : active === 'integrations' ? (
            <>
              <Field name="name" label="Integration name" />
              <CompanySelect data={data} optional />
              <div className="col-span-full"><Field name="url" label="Webhook URL" type="url" /></div>
              <Field name="secret" label="Signing secret" />
              <Field name="events" label="Events, comma separated" />
            </>
          ) : active === 'companies' ? (
            <>
              <Field name="name" label="Company name" />
              <Field name="legal_name" label="Legal name" />
              <Field name="tin" label="TIN" />
              <Field name="bin" label="BIN" />
              <Field name="pf_employee" label="Employee PF %" type="number" />
              <Field name="pf_employer" label="Employer PF %" type="number" />
              <Field name="gratuity_days" label="Gratuity days/year" type="number" />
              <Field name="overtime_multiplier" label="Overtime multiplier" type="number" />
            </>
          ) : (
            (forms[active] || []).map(([name, label, type = 'text', options]) => (
              <DynamicField key={name} data={data} name={name} label={label} type={type} options={options} />
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button disabled={saving} className="inline-flex h-10 items-center bg-teal-600 px-4 text-sm font-black text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DynamicField({ data, name, label, type, options }) {
  if (type === 'company') return <CompanySelect data={data} name={name} label={label} />;
  if (type === 'select') return <NativeSelect name={name} label={label} options={options.split(',')} />;
  return <Field name={name} label={label} type={type} />;
}

function Field({ name, label, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      <input required name={name} type={type} step={type === 'number' ? '0.01' : undefined} className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function CompanySelect({ data, name = 'company_id', label = 'Company', optional = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      <select required={!optional} name={name} className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        <option value="">{optional ? 'Global' : 'Select'}</option>
        {(data.companies || []).map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
      </select>
    </label>
  );
}

function NativeSelect({ name, label, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      <select name={name} className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        {options.map(option => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TabButton({ label, active, count, icon: Icon, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-h-20 items-center gap-3 px-4 py-3 text-left transition-all ${active ? 'bg-teal-50 text-teal-800' : 'bg-white/85 text-slate-600 hover:bg-slate-50'}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {React.createElement(Icon, { className: 'h-5 w-5' })}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black">{label}</span>
        <span className="mt-1 block text-xs font-bold text-slate-400">{count} records</span>
      </span>
    </button>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-black capitalize ${statusTone(status)}`}>
      {String(status || 'active').replace('_', ' ')}
    </span>
  );
}

function LoadingBlock({ label }) {
  return (
    <div className="flex min-h-72 items-center justify-center">
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
