import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyBangladeshiIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ReceiptPercentIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { compensationService } from '../../services/compensationService';
import { employeeService } from '../../services/employeeService';

const tabs = [
  ['runs', 'Payroll runs'],
  ['components', 'Components'],
  ['structures', 'Structures'],
  ['loans', 'Loans'],
  ['bonuses', 'Bonuses'],
  ['settlements', 'Settlements'],
];

const money = value => `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
const tabLabel = key => tabs.find(tab => tab[0] === key)?.[1] || 'Records';

const statusTone = status => {
  const value = String(status || 'active').toLowerCase();
  if (value.includes('paid') || value.includes('approved') || value.includes('active')) return 'border-teal-200 bg-teal-50 text-teal-800';
  if (value.includes('calculated') || value.includes('draft') || value.includes('pending')) return 'border-amber-200 bg-amber-50 text-amber-800';
  if (value.includes('failed') || value.includes('cancel')) return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-indigo-200 bg-indigo-50 text-indigo-800';
};

export default function CompensationWorkspace() {
  const [active, setActive] = useState('runs');
  const [data, setData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [year, setYear] = useState('2026-2027');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, employeeResponse] = await Promise.all([
        compensationService.overview(),
        employeeService.getAll(),
      ]);
      setData(overview.data || {});
      setEmployees(employeeResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load compensation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data[active] || [];
  const summary = useMemo(() => {
    const runs = data.runs || [];
    const bonuses = data.bonuses || [];
    const loans = data.loans || [];
    const settlements = data.settlements || [];

    return {
      runs: runs.length,
      paidRuns: runs.filter(row => row.status === 'paid').length,
      bonuses: bonuses.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      settlements: settlements.reduce((sum, row) => sum + Number(row.net_settlement || 0), 0),
      loans: loans.length,
    };
  }, [data]);

  const process = async (run, action) => {
    try {
      if (action === 'calculate') await compensationService.calculate(run.id, year);
      else await compensationService[action](run.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Payroll action failed');
    }
  };

  const submit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (modal === 'run') await compensationService.createRun(values);
      if (modal === 'bonus') await compensationService.createBonus({ ...values, employee_id: Number(values.employee_id), amount: Number(values.amount), is_taxable: true });
      if (modal === 'settlement') await compensationService.createFinalSettlement({ ...values, employee_id: Number(values.employee_id) });
      setModal(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading compensation...</p>
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
            <h1 className="text-3xl font-black">Compensation</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Paid</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Pending</span>
            </div>
            <button title="Refresh" onClick={load} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            {['runs', 'bonuses', 'settlements'].includes(active) && (
              <button onClick={() => setModal(active === 'runs' ? 'run' : active === 'bonuses' ? 'bonus' : 'settlement')} className="inline-flex h-11 items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15">
                <PlusIcon className="h-4 w-4" />
                New
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Payroll Runs" value={summary.runs} icon={ReceiptPercentIcon} theme="teal" />
        <SummaryCard label="Paid Runs" value={summary.paidRuns} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Bonus Value" value={money(summary.bonuses)} icon={CurrencyBangladeshiIcon} theme="amber" />
        <SummaryCard label="Settlements" value={money(summary.settlements)} icon={BanknotesIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Compensation Workflows</h2>
          </div>
          {active === 'runs' && (
            <label className="flex w-fit items-center gap-2 text-sm font-bold text-slate-700">
              Assessment year
              <input value={year} onChange={event => setYear(event.target.value)} className="h-10 w-32 border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
            </label>
          )}
        </div>

        <div className="overflow-x-auto border-b border-slate-200/80 bg-white/70">
          <div className="flex min-w-max">
            {tabs.map(([key, label]) => (
              <button key={key} onClick={() => setActive(key)} className={`min-h-12 border-b-2 px-4 py-2 text-sm font-bold transition ${active === key ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                {label}
                <span className="ml-2 text-xs text-slate-400">{data[key]?.length || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <BanknotesIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No records available</h3>
              <p className="mt-1 text-sm text-slate-500">Create a new record or switch to another compensation tab.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90">
                <tr>
                  <HeadCell>Record</HeadCell>
                  <HeadCell>Details</HeadCell>
                  <HeadCell>Amount / Period</HeadCell>
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
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{row.type || row.description || `${row.items_count ?? 0} employees`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">{recordValue(row)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge style={statusTone(row.status || row.calculation_type)}>{row.status || row.calculation_type || 'Active'}</Badge></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{active === 'runs' ? <RunActions run={row} process={process} /> : <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">No action</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modal && (
        <CompensationModal
          modal={modal}
          employees={employees}
          onClose={() => setModal(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function RunActions({ run, process }) {
  return (
    <div className="flex justify-end gap-2">
      {['draft', 'calculated'].includes(run.status) && <ActionButton onClick={() => process(run, 'calculate')}>Calculate</ActionButton>}
      {run.status === 'calculated' && <ActionButton tone="success" onClick={() => process(run, 'approve')}>Approve</ActionButton>}
      {run.status === 'approved' && <ActionButton tone="success" onClick={() => process(run, 'markPaid')}>Pay</ActionButton>}
      {!['draft', 'calculated', 'approved'].includes(run.status) && <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">No action</span>}
    </div>
  );
}

function CompensationModal({ modal, employees, onClose, onSubmit }) {
  const title = modal === 'run' ? 'New payroll run' : modal === 'bonus' ? 'Employee bonus' : 'Final settlement';
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Create compensation engine record.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {modal === 'run' ? (
            <>
              <Field name="name" label="Run name" />
              <Field name="period_start" label="Period start" type="date" />
              <Field name="period_end" label="Period end" type="date" />
              <Field name="payment_date" label="Payment date" type="date" />
            </>
          ) : (
            <>
              <EmployeeSelect employees={employees} />
              {modal === 'bonus' ? (
                <>
                  <NativeSelect name="type" label="Type" options={['festival', 'performance', 'attendance', 'other']} />
                  <Field name="name" label="Bonus name" />
                  <Field name="amount" label="Amount" type="number" />
                  <Field name="payment_date" label="Payment date" type="date" />
                </>
              ) : (
                <>
                  <Field name="last_working_date" label="Last working date" type="date" />
                  <Field name="notice_pay" label="Notice pay" type="number" />
                  <Field name="bonus_due" label="Bonus due" type="number" />
                </>
              )}
            </>
          )}
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

function ActionButton({ children, onClick, tone = 'default' }) {
  const style = tone === 'success' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-600 hover:text-white';
  return <button onClick={onClick} className={`px-3 py-2 text-sm font-black shadow-sm ${style}`}>{children}</button>;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function Field({ name, label, type = 'text' }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input required name={name} type={type} step={type === 'number' ? '0.01' : undefined} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function EmployeeSelect({ employees }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      Employee
      <select required name="employee_id" className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        <option value="">Select</option>
        {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.user?.name}</option>)}
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

function recordTitle(row) {
  return row.name || row.employee_name || row.code || row.loan_number || `#${row.id}`;
}

function recordValue(row) {
  if (row.amount || row.net_settlement) return money(row.amount || row.net_settlement);
  const start = (row.period_start || row.effective_from || '').slice(0, 10);
  const end = (row.period_end || '').slice(0, 10);
  return `${start || '-'}${end ? ` - ${end}` : ''}`;
}
