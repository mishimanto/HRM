import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  SquaresPlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { bulkService } from '../../services/bulkService';
import { departmentService } from '../../services/departmentService';

const statusOptions = [
  ['present', 'Present'],
  ['absent', 'Absent'],
  ['late', 'Late'],
  ['half_day', 'Half Day'],
  ['holiday', 'Holiday'],
];

const statusTone = status => {
  const value = String(status || '').toLowerCase();
  if (value === 'present') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (value === 'late' || value === 'half_day') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (value === 'absent') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (value === 'holiday') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const prettyStatus = status => status ? String(status).replace('_', ' ') : 'Not marked';

export default function BulkAttendance() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data || []);
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to load departments' });
    }
  }, []);

  const fetchEmployeesForBulk = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    setNotice(null);
    try {
      const params = { date: selectedDate };
      if (selectedDepartment) params.department_id = selectedDepartment;

      const response = await bulkService.getEmployeesForBulkAttendance(params);
      setEmployees(response.data || []);
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Unable to load employee attendance list' });
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  }, [selectedDate, selectedDepartment]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchEmployeesForBulk();
  }, [fetchEmployeesForBulk]);

  const summary = useMemo(() => {
    const picked = employees.filter(employee => employee.status);
    return {
      total: employees.length,
      present: employees.filter(employee => employee.status === 'present').length,
      absent: employees.filter(employee => employee.status === 'absent').length,
      pending: Math.max(employees.length - picked.length, 0),
    };
  }, [employees]);

  const handleStatusChange = (employeeId, status) => {
    setEmployees(prev => prev.map(employee => {
      if (employee.employee_id !== employeeId) return employee;
      const isWorkday = ['present', 'late', 'half_day'].includes(status);
      return {
        ...employee,
        status,
        check_in: isWorkday ? employee.check_in || '09:00' : null,
        check_out: isWorkday ? employee.check_out || (status === 'half_day' ? '13:00' : '17:00') : null,
      };
    }));
  };

  const handleTimeChange = (employeeId, field, value) => {
    setEmployees(prev => prev.map(employee => (
      employee.employee_id === employeeId ? { ...employee, [field]: value } : employee
    )));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const attendances = employees.map(employee => ({
        employee_id: employee.employee_id,
        status: employee.status || 'absent',
        check_in: employee.check_in,
        check_out: employee.check_out,
      }));

      await bulkService.bulkAttendance({ date: selectedDate, attendances });
      setNotice({ type: 'success', message: 'Bulk attendance saved successfully.' });
      await fetchEmployeesForBulk();
    } catch (error) {
      setNotice({ type: 'error', message: error.response?.data?.message || 'Error saving bulk attendance' });
    } finally {
      setSaving(false);
    }
  };

  const markAllAsPresent = () => {
    setEmployees(prev => prev.map(employee => ({
      ...employee,
      status: 'present',
      check_in: '09:00',
      check_out: '17:00',
    })));
  };

  const markAllAsAbsent = () => {
    setEmployees(prev => prev.map(employee => ({
      ...employee,
      status: 'absent',
      check_in: null,
      check_out: null,
    })));
  };

  if (loading && !hasLoaded) {
    return <PageLoadingBlock label="Loading bulk operations..." />;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">Bulk Attendance</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={fetchEmployeesForBulk} className="inline-flex h-11 items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15">
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || loading || employees.length === 0} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60">
              <PaperAirplaneIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {notice && <Alert type={notice.type} message={notice.message} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Employees Loaded" value={summary.total} icon={UserGroupIcon} theme="teal" />
        <SummaryCard label="Marked Present" value={summary.present} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Marked Absent" value={summary.absent} icon={NoSymbolIcon} theme="rose" />
        <SummaryCard label="Pending Selection" value={summary.pending} icon={ClockIcon} theme="amber" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Attendance Setup</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <QuickButton onClick={markAllAsPresent} icon={CheckCircleIcon} label="Mark All Present" tone="teal" disabled={employees.length === 0} />
            <QuickButton onClick={markAllAsAbsent} icon={NoSymbolIcon} label="Mark All Absent" tone="rose" disabled={employees.length === 0} />
          </div>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <Field label="Attendance Date">
            <div className="relative">
              <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={event => setSelectedDate(event.target.value)}
                className="h-12 w-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </div>
          </Field>
          <Field label="Department">
            <div className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={event => setSelectedDepartment(event.target.value)}
                className="h-12 w-full border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="">All Departments</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>
          </Field>
          <div className="flex items-end">
            <div className="w-full border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
              Unsaved rows default to absent when you submit this sheet.
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Employee Attendance Sheet</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black uppercase text-indigo-800">
            <SquaresPlusIcon className="h-4 w-4" />
            Batch entry
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="professional-loader mx-auto" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Loading employee list...</p>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-base font-black text-slate-700">No employees found</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Change department filter or refresh the list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Current</th>
                  <th className="px-5 py-3">New Status</th>
                  <th className="px-5 py-3">Check In</th>
                  <th className="px-5 py-3">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/70">
                {employees.map(employee => {
                  const timeEnabled = ['present', 'late', 'half_day'].includes(employee.status);
                  return (
                    <tr key={employee.employee_id} className="hover:bg-teal-50/35">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{employee.employee_name}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">{employee.employee_code || `#${employee.employee_id}`}</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">{employee.department || 'Unassigned'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={employee.current_status} />
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={employee.status || ''}
                          onChange={event => handleStatusChange(employee.employee_id, event.target.value)}
                          className="h-10 min-w-36 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                        >
                          <option value="">Select Status</option>
                          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="time"
                          value={employee.check_in || ''}
                          onChange={event => handleTimeChange(employee.employee_id, 'check_in', event.target.value)}
                          disabled={!timeEnabled}
                          className="h-10 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          type="time"
                          value={employee.check_out || ''}
                          onChange={event => handleTimeChange(employee.employee_id, 'check_out', event.target.value)}
                          disabled={!timeEnabled}
                          className="h-10 border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })}
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

function QuickButton({ onClick, icon: Icon, label, tone, disabled }) {
  const styles = tone === 'rose'
    ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
    : 'border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-10 items-center gap-2 border px-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}>
      {React.createElement(Icon, { className: 'h-4 w-4' })}
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-black capitalize ${statusTone(status)}`}>
      {prettyStatus(status)}
    </span>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
