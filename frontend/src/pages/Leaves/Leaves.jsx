import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlusIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

const leaveTypes = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'annual', label: 'Annual Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
];

const statusStyles = {
  approved: 'border-teal-200 bg-teal-50 text-teal-800',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
};

const typeStyles = {
  sick: 'border-sky-200 bg-sky-50 text-sky-800',
  casual: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  annual: 'border-teal-200 bg-teal-50 text-teal-800',
  maternity: 'border-pink-200 bg-pink-50 text-pink-800',
  paternity: 'border-violet-200 bg-violet-50 text-violet-800',
  emergency: 'border-amber-200 bg-amber-50 text-amber-800',
};

const normalizeRows = response => response.data?.data || response.data || [];

export default function Leaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const roleSlug = user?.role?.slug;
  const canManageLeaves = roleSlug === 'admin' || roleSlug === 'hr';
  const canApply = ['admin', 'hr', 'employee'].includes(roleSlug);

  const fetchLeaves = useCallback(async () => {
    setError('');
    try {
      const response = canManageLeaves ? await leaveService.getAll() : await leaveService.getMyLeaves();
      setLeaves(normalizeRows(response));
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setLeaves([]);
      setError(err.response?.data?.message || 'Failed to fetch leave applications');
    } finally {
      setLoading(false);
    }
  }, [canManageLeaves]);

  const fetchEmployees = useCallback(async () => {
    if (!canManageLeaves) return;
    try {
      const response = await employeeService.getAll();
      setEmployees(normalizeRows(response));
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    }
  }, [canManageLeaves]);

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, [fetchLeaves, fetchEmployees]);

  const summary = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(leave => leave.status === 'pending').length,
    approved: leaves.filter(leave => leave.status === 'approved').length,
    rejected: leaves.filter(leave => leave.status === 'rejected').length,
  }), [leaves]);

  const filteredLeaves = useMemo(() => leaves.filter(leave => {
    const statusMatches = statusFilter === 'all' || leave.status === statusFilter;
    const typeMatches = typeFilter === 'all' || leave.leave_type === typeFilter;
    return statusMatches && typeMatches;
  }), [leaves, statusFilter, typeFilter]);

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type: 'sick',
      start_date: '',
      end_date: '',
      reason: '',
    });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage('');
    setError('');

    const employeeId = canManageLeaves ? formData.employee_id : user?.employee?.id;
    const hasOverlap = leaves.some(leave => {
      const sameEmployee = !employeeId || String(leave.employee_id) === String(employeeId);
      const activeLeave = leave.status !== 'rejected';
      return sameEmployee
        && activeLeave
        && new Date(formData.start_date) <= new Date(leave.end_date)
        && new Date(formData.end_date) >= new Date(leave.start_date);
    });

    if (hasOverlap) {
      setError('There is already an active leave application for this period.');
      return;
    }

    try {
      const submitData = { ...formData };
      if (!canManageLeaves && user?.employee?.id) {
        submitData.employee_id = user.employee.id;
      }

      await leaveService.create(submitData);
      setShowModal(false);
      resetForm();
      setMessage('Leave application submitted successfully');
      fetchLeaves();
    } catch (err) {
      const validationMessages = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : err.response?.data?.message || 'Error creating leave application';
      setError(validationMessages);
    }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    const actionText = status === 'approved' ? 'approve' : 'reject';
    const result = await Swal.fire({
      title: `Are you sure you want to ${actionText} this leave?`,
      icon: status === 'approved' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionText} it`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        confirmButton: status === 'approved'
          ? 'bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded'
          : 'bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded',
        cancelButton: 'bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 me-3 rounded',
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;

    setMessage('');
    setError('');
    try {
      await leaveService.updateStatus(leaveId, { status });
      setMessage(`Leave request has been ${status}`);
      fetchLeaves();
    } catch (err) {
      console.error('Error updating leave status:', err);
      setError(err.response?.data?.message || 'Error updating leave status');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading leave applications...</p>
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
            <h1 className="mt-2 text-3xl font-black">Leaves</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="h-11 border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none [color-scheme:dark] focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={event => setTypeFilter(event.target.value)}
              className="h-11 border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none [color-scheme:dark] focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
            >
              <option value="all">All Types</option>
              {leaveTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            {canApply && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300"
              >
                <PlusIcon className="h-4 w-4" />
                Apply Leave
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Requests" value={summary.total} icon={CalendarDaysIcon} theme="teal" />
        <SummaryCard label="Pending" value={summary.pending} icon={ClockIcon} theme="amber" />
        <SummaryCard label="Approved" value={summary.approved} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Rejected" value={summary.rejected} icon={XCircleIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Leave Applications</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {filteredLeaves.length} applications
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/90">
              <tr>
                {canManageLeaves && <HeadCell>Employee</HeadCell>}
                <HeadCell>Leave Type</HeadCell>
                <HeadCell>Period</HeadCell>
                <HeadCell>Total Days</HeadCell>
                <HeadCell>Status</HeadCell>
                <HeadCell>Reason</HeadCell>
                {canManageLeaves && <HeadCell>Actions</HeadCell>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80">
              {filteredLeaves.map(leave => {
                const employeeName = leave.employee?.user?.name || 'N/A';
                const typeLabel = leaveTypes.find(type => type.value === leave.leave_type)?.label || leave.leave_type || 'Leave';
                return (
                  <tr key={leave.id} className="transition hover:bg-teal-50/40">
                    {canManageLeaves && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex min-w-[220px] items-center">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                            <UserCircleIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4 min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{employeeName}</p>
                            <p className="mt-1 truncate text-sm text-slate-500">{leave.employee?.department?.name || 'Employee Leave'}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge style={typeStyles[leave.leave_type]}>{typeLabel}</Badge>
                    </td>
                    <DataCell primary={formatDate(leave.start_date)} secondary={`to ${formatDate(leave.end_date)}`} />
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">{leave.total_days || 0} days</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge style={statusStyles[leave.status]}>{leave.status || 'pending'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-sm font-medium text-slate-500">{leave.reason || '-'}</p>
                    </td>
                    {canManageLeaves && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <LeaveAction leave={leave} onStatusUpdate={handleStatusUpdate} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeaves.length === 0 && (
          <div className="p-10 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">No leave applications found</h3>
            <p className="mt-1 text-sm text-slate-500">No requests match the selected filters.</p>
          </div>
        )}
      </section>

      {showModal && (
        <LeaveModal
          canManageLeaves={canManageLeaves}
          employees={employees}
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function HeadCell({ children }) {
  return <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">{children}</th>;
}

function DataCell({ primary, secondary }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      <p className="text-sm font-bold text-slate-900">{primary}</p>
      {secondary && <p className="mt-1 text-xs font-medium text-slate-500">{secondary}</p>}
    </td>
  );
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style || 'border-slate-200 bg-slate-100 text-slate-700'}`}>{String(children).replace('_', ' ')}</span>;
}

function LeaveAction({ leave, onStatusUpdate }) {
  if (leave.status !== 'pending') {
    return <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">Processed</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onStatusUpdate(leave.id, 'approved')} className="inline-flex items-center gap-2 bg-teal-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
        <CheckCircleIcon className="h-4 w-4" />
        Approve
      </button>
      <button onClick={() => onStatusUpdate(leave.id, 'rejected')} className="inline-flex items-center gap-2 bg-rose-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(190,18,60,0.18)] hover:bg-rose-700">
        <XCircleIcon className="h-4 w-4" />
        Reject
      </button>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function LeaveModal({ canManageLeaves, employees, formData, setFormData, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <div className="w-full max-w-2xl overflow-hidden rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Apply for Leave</h2>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 rounded-full items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {canManageLeaves && (
            <Field label="Employee">
              <select
                required
                value={formData.employee_id}
                onChange={event => setFormData({ ...formData, employee_id: event.target.value })}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="">Select Employee</option>
                {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.user?.name}</option>)}
              </select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Leave Type">
              <select
                required
                value={formData.leave_type}
                onChange={event => setFormData({ ...formData, leave_type: event.target.value })}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                {leaveTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </Field>
            <Field label="Start Date">
              <input
                required
                type="date"
                value={formData.start_date}
                onChange={event => setFormData({ ...formData, start_date: event.target.value })}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </Field>
            <Field label="End Date">
              <input
                required
                type="date"
                value={formData.end_date}
                onChange={event => setFormData({ ...formData, end_date: event.target.value })}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </Field>
          </div>

          <Field label="Reason">
            <textarea
              required
              rows="4"
              value={formData.reason}
              onChange={event => setFormData({ ...formData, reason: event.target.value })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              placeholder="Please provide a reason for your leave..."
            />
          </Field>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center justify-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
              <PaperAirplaneIcon className="h-4 w-4" />
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}
