import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import { attendanceService } from '../../services/attendanceService';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const statusStyles = {
  present: 'border-teal-200 bg-teal-50 text-teal-800',
  absent: 'border-rose-200 bg-rose-50 text-rose-800',
  late: 'border-amber-200 bg-amber-50 text-amber-800',
  half_day: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  holiday: 'border-slate-200 bg-slate-100 text-slate-700',
};

const normalizeRows = response => response.data?.data || response.data || [];

export default function MyAttendance() {
  const [attendances, setAttendances] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchMyAttendance = useCallback(async () => {
    setError('');
    try {
      const response = await attendanceService.myAttendance({ month: selectedMonth });
      setAttendances(normalizeRows(response));
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Failed to fetch attendance');
    }
  }, [selectedMonth]);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const response = await attendanceService.myAttendance({ date: new Date().toISOString().split('T')[0] });
      const rows = normalizeRows(response);
      setTodayAttendance(rows[0] || null);
    } catch (err) {
      console.error('Error fetching today attendance:', err);
      setError(err.response?.data?.message || 'Failed to fetch today attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyAttendance();
    fetchTodayAttendance();
  }, [fetchMyAttendance, fetchTodayAttendance]);

  const handleCheckIn = async () => {
    setMessage('');
    setError('');
    try {
      const response = await attendanceService.myCheckIn({});
      setMessage(response.data.message || 'Checked in successfully');
      fetchTodayAttendance();
      fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    setMessage('');
    setError('');
    try {
      const response = await attendanceService.myCheckOut({});
      setMessage(response.data.message || 'Checked out successfully');
      fetchTodayAttendance();
      fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Check-out failed');
    }
  };

  const summary = useMemo(() => ({
    present: attendances.filter(item => item.status === 'present').length,
    late: attendances.filter(item => item.status === 'late').length,
    absent: attendances.filter(item => item.status === 'absent').length,
    hours: attendances.reduce((sum, item) => sum + Number(item.total_hours || 0), 0),
  }), [attendances]);

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
      <section className="relative overflow-hidden rounded-[10px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-200/80">Personal attendance</p>
            <h1 className="mt-2 text-3xl font-black">My Attendance</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-cyan-50/75">Check in, check out and review your monthly attendance history.</p>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={event => setSelectedMonth(event.target.value)}
            className="h-11 border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none [color-scheme:dark] focus:border-teal-300 focus:ring-4 focus:ring-teal-300/20"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Today</h2>
          <p className="mt-1 text-sm text-slate-500">Current workday attendance status</p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-3">
          <TodayBox label="Check In" value={formatTime(todayAttendance?.check_in) || 'Not checked in'} theme="teal" />
          <TodayBox label="Check Out" value={formatTime(todayAttendance?.check_out) || 'Not checked out'} theme="rose" />
          <TodayBox label="Status" value={<StatusBadge status={todayAttendance?.status} />} theme="indigo" />
        </div>
        <div className="flex justify-center border-t border-slate-100 px-5 py-5">
          {!todayAttendance?.check_in ? (
            <button onClick={handleCheckIn} className="inline-flex h-11 items-center gap-2 bg-teal-600 px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
              <CheckCircleIcon className="h-5 w-5" />
              Check In
            </button>
          ) : !todayAttendance?.check_out ? (
            <button onClick={handleCheckOut} className="inline-flex h-11 items-center gap-2 bg-rose-600 px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(190,18,60,0.18)] hover:bg-rose-700">
              <XCircleIcon className="h-5 w-5" />
              Check Out
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800">
              <CheckCircleIcon className="h-5 w-5" />
              Attendance Completed for Today
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Present" value={summary.present} icon={CheckCircleIcon} theme="teal" />
        <SummaryCard label="Late" value={summary.late} icon={ExclamationTriangleIcon} theme="amber" />
        <SummaryCard label="Absent" value={summary.absent} icon={XCircleIcon} theme="rose" />
        <SummaryCard label="Work Hours" value={formatTotalHours(summary.hours)} icon={ClockIcon} theme="indigo" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Monthly Attendance History</h2>
          <p className="mt-1 text-sm text-slate-500">{new Date(`${selectedMonth}-01T00:00:00`).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/90">
              <tr>
                <HeadCell>Date</HeadCell>
                <HeadCell>Check In</HeadCell>
                <HeadCell>Check Out</HeadCell>
                <HeadCell>Total Hours</HeadCell>
                <HeadCell>Status</HeadCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80">
              {attendances.map(attendance => (
                <tr key={attendance.id} className="transition hover:bg-teal-50/40">
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{new Date(attendance.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatTime(attendance.check_in)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatTime(attendance.check_out)}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-900">{formatTotalHours(attendance.total_hours)}</td>
                  <td className="px-6 py-4"><StatusBadge status={attendance.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {attendances.length === 0 && (
          <div className="p-10 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-900">No attendance records</h3>
            <p className="mt-1 text-sm text-slate-500">No records found for the selected month.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function TodayBox({ label, value, theme }) {
  const styles = {
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  }[theme];
  return (
    <div className={`border p-4 text-center shadow-sm ${styles}`}>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function HeadCell({ children }) {
  return <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">{children}</th>;
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'border-slate-200 bg-slate-100 text-slate-700';
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{(status || 'not marked').replace('_', ' ')}</span>;
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
