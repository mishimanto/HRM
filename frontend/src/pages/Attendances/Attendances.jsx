import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const statusStyles = {
  present: 'border-teal-200 bg-teal-50 text-teal-800',
  absent: 'border-rose-200 bg-rose-50 text-rose-800',
  late: 'border-amber-200 bg-amber-50 text-amber-800',
  half_day: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  holiday: 'border-slate-200 bg-slate-100 text-slate-700',
};

const today = () => new Date().toISOString().split('T')[0];

const employeeFromUser = user => {
  if (!user?.employee) return null;
  return {
    ...user.employee,
    user,
  };
};

export default function Attendances() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isToday = selectedDate === today();
  const canViewAllAttendances = [1, 2, 3].includes(Number(user?.role_id));
  const isCurrentUser = useCallback(employee => employee.user_id === user?.id, [user?.id]);
  const canPerformAction = useCallback(employee => canViewAllAttendances || isCurrentUser(employee), [canViewAllAttendances, isCurrentUser]);

  const fetchAttendances = useCallback(async () => {
    setError('');
    try {
      const response = canViewAllAttendances
        ? await attendanceService.getAll({ date: selectedDate })
        : await attendanceService.myAttendance({ date: selectedDate });
      setAttendances(canViewAllAttendances ? response.data.data || [] : response.data || []);
    } catch (err) {
      console.error('Error fetching attendances:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendances');
    } finally {
      setLoading(false);
    }
  }, [canViewAllAttendances, selectedDate]);

  const fetchEmployees = useCallback(async () => {
    try {
      if (!canViewAllAttendances) {
        setEmployees([employeeFromUser(user)].filter(Boolean));
        return;
      }

      const response = await employeeService.getAll();
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.message || 'Failed to fetch employees');
    }
  }, [canViewAllAttendances, user]);

  useEffect(() => {
    fetchAttendances();
    fetchEmployees();
  }, [fetchAttendances, fetchEmployees]);

  const handleCheckIn = async employeeId => {
    setMessage('');
    setError('');
    try {
      const response = await attendanceService.checkIn({ employee_id: employeeId });
      setMessage(response.data.message || 'Checked in successfully');
      fetchAttendances();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async employeeId => {
    setMessage('');
    setError('');
    try {
      const response = await attendanceService.checkOut({ employee_id: employeeId });
      setMessage(response.data.message || 'Checked out successfully');
      fetchAttendances();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    }
  };

  const filteredEmployees = useMemo(() => (
    canViewAllAttendances ? employees : employees.filter(employee => isCurrentUser(employee))
  ), [canViewAllAttendances, employees, isCurrentUser]);

  const attendanceByEmployee = useMemo(() => {
    const map = new Map();
    attendances.forEach(attendance => map.set(attendance.employee_id, attendance));
    return map;
  }, [attendances]);

  const summary = {
    online: attendances.filter(item => item.check_in && !item.check_out).length,
    present: attendances.filter(item => item.status === 'present').length,
    late: attendances.filter(item => item.status === 'late').length,
    absent: attendances.filter(item => item.status === 'absent').length,
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading attendance...</p>
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
            <h1 className="text-3xl font-black">Attendance</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canViewAllAttendances && (
              <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
                <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Online</span>
                <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Offline</span>
              </div>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
              className="h-11 border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none [color-scheme:dark] focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
            />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}
      {!isToday && (
        <Alert
          type="warning"
          message={`Viewing ${selectedDate}. Check-in/check-out actions are only available for today (${new Date().toLocaleDateString()}).`}
        />
      )}

      {canViewAllAttendances && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Online Now" value={summary.online} icon={ClockIcon} theme="teal" />
          <SummaryCard label="Present" value={summary.present} icon={CheckCircleIcon} theme="indigo" />
          <SummaryCard label="Late" value={summary.late} icon={ExclamationTriangleIcon} theme="amber" />
          <SummaryCard label="Absent" value={summary.absent} icon={XCircleIcon} theme="rose" />
        </div>
      )}

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{isToday ? "Today's Attendance" : `Attendance - ${selectedDate}`}</h2>

          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/90">
              <tr>
                {canViewAllAttendances && <HeadCell align="center">Status</HeadCell>}
                <HeadCell>Employee</HeadCell>
                <HeadCell align="center">Check In</HeadCell>
                <HeadCell align="center">Check Out</HeadCell>
                <HeadCell align="center">Total Hours</HeadCell>
                <HeadCell align="center">Mark</HeadCell>
                <HeadCell align="center">Actions</HeadCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80">
              {filteredEmployees.map(employee => {
                const attendance = attendanceByEmployee.get(employee.id);
                const online = Boolean(attendance?.check_in && !attendance?.check_out);
                return (
                  <tr key={employee.id} className="transition hover:bg-teal-50/40">
                    {canViewAllAttendances && (
                      <td className="px-6 py-4 flex justify-center">
                        <span className={`block h-3 w-3 rounded-full ring-4 ${online ? 'bg-emerald-500 ring-emerald-100' : 'bg-slate-300 ring-slate-100'}`} title={online ? `Checked in at ${formatTime(attendance.check_in)}` : 'Offline'} />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex min-w-[220px] items-center">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[4px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                          <UserCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">{employee.user?.name || 'N/A'}</p>
                            {isCurrentUser(employee) && <span className="border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-800">You</span>}
                          </div>
                          <p className="mt-1 truncate text-sm text-slate-500">{employee.user?.employee_id || 'N/A'}{employee.department?.name ? ` - ${employee.department.name}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <DataCell primary={formatTime(attendance?.check_in)} secondary={attendance?.check_in ? weekday(selectedDate) : null} />
                    <DataCell primary={formatTime(attendance?.check_out)} secondary={attendance?.check_out ? weekday(selectedDate) : null} />
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-center text-slate-900">{formatTotalHours(attendance?.total_hours)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StatusBadge status={attendance?.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap flex justify-center align-center">
                      <AttendanceAction
                        employee={employee}
                        attendance={attendance}
                        canPerform={canPerformAction(employee)}
                        isToday={isToday}
                        onCheckIn={handleCheckIn}
                        onCheckOut={handleCheckOut}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-10 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">No employees found</h3>
            <p className="mt-1 text-sm text-slate-500">{canViewAllAttendances ? 'No employees are available for attendance tracking.' : 'No attendance profile is linked to your account.'}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function HeadCell({ children, align }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase text-slate-500 whitespace-nowrap ${align === 'center' ? 'text-center' : 'text-left'}`}>{children}</th>;
}

function DataCell({ primary, secondary }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap text-center">
      <p className="text-sm font-bold text-slate-900">{primary}</p>
      {secondary && <p className="mt-1 text-xs font-medium text-slate-500">{secondary}</p>}
    </td>
  );
}

function StatusBadge({ status }) {
  const normalized = status || 'not marked';
  const style = statusStyles[status] || 'border-slate-200 bg-slate-100 text-slate-700';
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{normalized.replace('_', ' ')}</span>;
}

function AttendanceAction({ employee, attendance, canPerform, isToday, onCheckIn, onCheckOut }) {
  if (!canPerform) return <span className="text-xs font-bold text-slate-400">View only</span>;
  if (!isToday) return <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">View only</span>;
  if (!attendance?.check_in) {
    return (
      <button onClick={() => onCheckIn(employee.id)} className="inline-flex items-center gap-2 bg-teal-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
        <CheckCircleIcon className="h-4 w-4" />
        Check In
      </button>
    );
  }
  if (!attendance?.check_out) {
    return (
      <button onClick={() => onCheckOut(employee.id)} className="inline-flex items-center gap-2 bg-rose-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(190,18,60,0.18)] hover:bg-rose-700">
        <XCircleIcon className="h-4 w-4" />
        Check Out
      </button>
    );
  }
  return <span className="border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">Completed</span>;
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function formatTime(timeString) {
  if (!timeString) return '-';
  if (timeString.includes('T')) {
    return new Date(timeString).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  const [hours, minutes] = timeString.split(':');
  const hour = Number(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minutes} ${ampm}`;
}

function formatTotalHours(totalHours) {
  if (!totalHours && totalHours !== 0) return '-';
  const totalMinutes = Math.max(0, Number(totalHours) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0 && minutes === 0) return '0 hrs';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours} hrs`;
  return `${hours}h ${minutes}m`;
}

function weekday(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-BD', { weekday: 'short' });
}
