import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import Swal from 'sweetalert2';
import { calendarService } from '../../services/calendarService';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  SparklesIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const legendItems = [
  { label: 'Approved', color: 'bg-teal-500' },
  { label: 'Pending', color: 'bg-amber-400' },
  { label: 'Rejected / Absent', color: 'bg-rose-500' },
  { label: 'Birthdays', color: 'bg-indigo-500' },
  { label: 'Holidays', color: 'bg-slate-500' },
];

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canViewAllEvents = useMemo(() => ['admin', 'hr'].includes(user?.role?.slug), [user?.role?.slug]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = canViewAllEvents
        ? await calendarService.getEvents()
        : await calendarService.getMyEvents();

      setEvents(response.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [canViewAllEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const summary = useMemo(() => ({
    total: events.length,
    approved: events.filter(event => event.extendedProps?.status === 'approved').length,
    pending: events.filter(event => event.extendedProps?.status === 'pending').length,
    special: events.filter(event => ['birthday', 'holiday'].includes(event.extendedProps?.type)).length,
  }), [events]);

  const handleEventClick = clickInfo => {
    const event = clickInfo.event;
    const eventType = event.extendedProps?.type;

    let htmlContent = `
      <div class="text-left" style="margin: 15px 0;">
        <p style="margin-bottom: 8px;"><strong>Start:</strong> ${formatDate(event.startStr)}</p>
    `;

    if (event.end) {
      htmlContent += `<p style="margin-bottom: 8px;"><strong>End:</strong> ${formatDate(event.endStr)}</p>`;
    }

    if (eventType) {
      htmlContent += `<p style="margin-bottom: 8px;"><strong>Type:</strong> ${eventType}</p>`;
    }

    if (canViewAllEvents && event.extendedProps?.employee_name) {
      htmlContent += `<p style="margin-bottom: 8px;"><strong>Employee:</strong> ${event.extendedProps.employee_name}</p>`;
    }

    if (event.extendedProps?.status) {
      htmlContent += `<p style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: ${getStatusColor(event.extendedProps.status)}; font-weight: bold;">${event.extendedProps.status.toUpperCase()}</span></p>`;
    }

    if (event.extendedProps?.reason) {
      htmlContent += `<p style="margin-bottom: 8px;"><strong>Reason:</strong> ${event.extendedProps.reason}</p>`;
    }

    htmlContent += '</div>';

    Swal.fire({
      title: event.title,
      html: htmlContent,
      icon: 'info',
      showConfirmButton: false,
      showCloseButton: true,
      width: '500px',
      customClass: {
        popup: 'rounded-lg',
        title: 'text-xl font-bold text-gray-900 mb-0',
        closeButton: 'text-gray-400 hover:text-gray-600 text-2xl',
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading calendar...</p>
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
            <h1 className="text-3xl font-black">Calendar View</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Leave</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-indigo-400" /> Special</span>
            </div>
            <button
              type="button"
              onClick={fetchEvents}
              className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert type="error" message={error} action={fetchEvents} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Events" value={summary.total} icon={CalendarDaysIcon} theme="teal" />
        <SummaryCard label="Approved" value={summary.approved} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Pending" value={summary.pending} icon={ClockIcon} theme="amber" />
        <SummaryCard label="Special Days" value={summary.special} icon={SparklesIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Event Calendar</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {events.length} events
          </span>
        </div>

        <div className="calendar-shell p-4 sm:p-5">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay,listMonth',
            }}
            initialView="dayGridMonth"
            editable={false}
            selectable={false}
            selectMirror
            dayMaxEvents
            weekends
            events={events}
            eventClick={handleEventClick}
            height="auto"
            eventDisplay="block"
            eventColor="#0f766e"
            views={{
              listMonth: { buttonText: 'list' },
            }}
            displayEventTime={false}
            allDayText=""
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Legend</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          {legendItems
            .filter(item => canViewAllEvents || !['Holidays'].includes(item.label))
            .map(item => (
              <div key={item.label} className="flex items-center gap-3 border border-slate-100 bg-slate-50 px-3 py-3">
                <span className={`h-3 w-3 rounded-full ring-4 ring-white ${item.color}`} />
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusColor(status) {
  switch (status) {
    case 'approved': return '#0f766e';
    case 'pending': return '#d97706';
    case 'rejected': return '#e11d48';
    default: return '#64748b';
  }
}

export default Calendar;
