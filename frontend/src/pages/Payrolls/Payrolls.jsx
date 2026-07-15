import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { employeeService } from '../../services/employeeService';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyBangladeshiIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  UserCircleIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const initialForm = () => ({
  employee_id: '',
  pay_period: 'monthly',
  pay_date: new Date().toISOString().split('T')[0],
  basic_salary: '',
  house_allowance: '',
  transport_allowance: '',
  bonus: '',
  overtime_pay: '',
  tax_deduction: '',
  other_deductions: '',
});

const statusStyles = {
  paid: 'border-teal-200 bg-teal-50 text-teal-800',
  processed: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  draft: 'border-amber-200 bg-amber-50 text-amber-800',
};

const normalizeRows = response => response.data?.data || response.data || [];
const money = value => `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;

const Payrolls = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const roleSlug = user?.role?.slug;
  const canManagePayroll = roleSlug === 'admin' || roleSlug === 'hr';

  const fetchPayrolls = useCallback(async () => {
    setError('');
    try {
      const response = canManagePayroll ? await payrollService.getAll() : await payrollService.getMyPayrolls();
      setPayrolls(normalizeRows(response));
    } catch (err) {
      console.error('Error fetching payrolls:', err);
      setPayrolls([]);
      setError(err.response?.data?.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [canManagePayroll]);

  const fetchEmployees = useCallback(async () => {
    if (!canManagePayroll) return;

    try {
      const response = await employeeService.getAll();
      setEmployees(normalizeRows(response));
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    }
  }, [canManagePayroll]);

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [fetchEmployees, fetchPayrolls]);

  const summary = useMemo(() => {
    const totalNet = payrolls.reduce((sum, payroll) => sum + Number(payroll.net_salary || 0), 0);
    const totalDeductions = payrolls.reduce((sum, payroll) => sum + Number(payroll.tax_deduction || 0) + Number(payroll.other_deductions || 0), 0);
    const paid = payrolls.filter(payroll => payroll.status === 'paid').length;

    return {
      records: payrolls.length,
      totalNet,
      totalDeductions,
      paid,
    };
  }, [payrolls]);

  const calculatedNetSalary = useMemo(() => {
    const basic = Number(formData.basic_salary) || 0;
    const house = Number(formData.house_allowance) || 0;
    const transport = Number(formData.transport_allowance) || 0;
    const bonus = Number(formData.bonus) || 0;
    const overtime = Number(formData.overtime_pay) || 0;
    const tax = Number(formData.tax_deduction) || 0;
    const other = Number(formData.other_deductions) || 0;
    return basic + house + transport + bonus + overtime - tax - other;
  }, [formData]);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    try {
      await payrollService.create(formData);
      setShowModal(false);
      setFormData(initialForm());
      fetchPayrolls();
    } catch (err) {
      console.error('Error creating payroll:', err);
      setError(err.response?.data?.message || 'Error creating payroll');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading payroll...</p>
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
            <h1 className="text-3xl font-black">Payroll</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Paid</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Draft</span>
            </div>
            {canManagePayroll && (
              <button onClick={() => setShowModal(true)} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
                <PlusIcon className="h-4 w-4" />
                Create Payroll
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Payroll Records" value={summary.records} icon={WalletIcon} theme="teal" />
        <SummaryCard label="Net Payroll" value={money(summary.totalNet)} icon={CurrencyBangladeshiIcon} theme="indigo" />
        <SummaryCard label="Deductions" value={money(summary.totalDeductions)} icon={ExclamationTriangleIcon} theme="amber" />
        <SummaryCard label="Paid Records" value={summary.paid} icon={CheckCircleIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Payroll Register</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {payrolls.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          {payrolls.length === 0 ? (
            <div className="p-10 text-center">
              <BanknotesIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No payroll records found</h3>
              <p className="mt-1 text-sm text-slate-500">Create payroll records to start tracking compensation.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90">
                <tr>
                  {canManagePayroll && <HeadCell>Employee</HeadCell>}
                  <HeadCell>Pay Period</HeadCell>
                  <HeadCell>Pay Date</HeadCell>
                  <HeadCell>Basic Salary</HeadCell>
                  <HeadCell>Allowances</HeadCell>
                  <HeadCell>Deductions</HeadCell>
                  <HeadCell>Net Salary</HeadCell>
                  <HeadCell>Status</HeadCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {payrolls.map(payroll => {
                  const allowanceTotal = allowanceAmount(payroll);
                  const deductions = Number(payroll.tax_deduction || 0) + Number(payroll.other_deductions || 0);
                  return (
                    <tr key={payroll.id} className="transition hover:bg-teal-50/40">
                      {canManagePayroll && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex min-w-[220px] items-center">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                              <UserCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4 min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{payroll.employee?.user?.name || 'N/A'}</p>
                              <p className="mt-1 truncate text-sm text-slate-500">{payroll.employee?.user?.employee_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <DataCell primary={payroll.pay_period} secondary="Period" capitalize />
                      <DataCell primary={formatDate(payroll.pay_date)} secondary="Payment date" />
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">{money(payroll.basic_salary)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-black text-teal-700">{money(allowanceTotal)}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">House, transport, bonus, overtime</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-rose-700">{money(deductions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-950">{money(payroll.net_salary)}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><Badge style={statusStyles[payroll.status]}>{payroll.status || 'draft'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showModal && (
        <PayrollModal
          employees={employees}
          formData={formData}
          setFormData={setFormData}
          netSalary={calculatedNetSalary}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

function PayrollModal({ employees, formData, setFormData, netSalary, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Create Payroll</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 rounded-full items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
            Employee
            <select required value={formData.employee_id} onChange={event => setFormData({ ...formData, employee_id: event.target.value })} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
              <option value="">Select Employee</option>
              {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.user?.name} - {money(employee.salary)}</option>)}
            </select>
          </label>
          <SelectField label="Pay Period" value={formData.pay_period} onChange={value => setFormData({ ...formData, pay_period: value })} options={['monthly', 'bi-weekly', 'weekly']} />
          <InputField label="Pay Date" type="date" value={formData.pay_date} onChange={value => setFormData({ ...formData, pay_date: value })} required />
          <InputField label="Basic Salary" type="number" value={formData.basic_salary} onChange={value => setFormData({ ...formData, basic_salary: value })} required />
          <InputField label="House Allowance" type="number" value={formData.house_allowance} onChange={value => setFormData({ ...formData, house_allowance: value })} />
          <InputField label="Transport Allowance" type="number" value={formData.transport_allowance} onChange={value => setFormData({ ...formData, transport_allowance: value })} />
          <InputField label="Bonus" type="number" value={formData.bonus} onChange={value => setFormData({ ...formData, bonus: value })} />
          <InputField label="Overtime Pay" type="number" value={formData.overtime_pay} onChange={value => setFormData({ ...formData, overtime_pay: value })} />
          <InputField label="Tax Deduction" type="number" value={formData.tax_deduction} onChange={value => setFormData({ ...formData, tax_deduction: value })} />
          <InputField label="Other Deductions" type="number" value={formData.other_deductions} onChange={value => setFormData({ ...formData, other_deductions: value })} />
          <div className="border border-teal-100 bg-teal-50 p-4 sm:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-black text-teal-900">Estimated Net Salary</span>
              <span className="text-xl font-black text-teal-700">{money(netSalary)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
            <PlusIcon className="h-4 w-4" />
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function HeadCell({ children }) {
  return <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">{children}</th>;
}

function DataCell({ primary, secondary, capitalize }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <p className={`text-sm font-bold text-slate-900 ${capitalize ? 'capitalize' : ''}`}>{primary || '-'}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{secondary}</p>
    </td>
  );
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style || 'border-slate-200 bg-slate-100 text-slate-700'}`}>{String(children).replace('_', ' ')}</span>;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function InputField({ label, type, value, onChange, required }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input required={required} type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select required value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function allowanceAmount(payroll) {
  return Number(payroll.house_allowance || 0)
    + Number(payroll.transport_allowance || 0)
    + Number(payroll.bonus || 0)
    + Number(payroll.overtime_pay || 0);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default Payrolls;
