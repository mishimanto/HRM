import React, { useEffect, useMemo, useState } from 'react';
import SharedStatCard from '../../components/UI/StatCard';
import {
  ArrowPathIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import { operationsService } from '../../services/operationsService';
import { toast } from '../../utils/toast';

const formatType = type => (type || 'notification').replaceAll('.', ' ');

const formatDate = value => {
  if (!value) return 'Just now';
  return new Date(value).toLocaleString();
};

const normalizeNotifications = records => records.map(item => ({
  id: item.id,
  title: formatType(item.type),
  message: item.data?.message || item.data?.status || item.data?.comments || 'Your request has been updated',
  time: item.created_at,
  read: Boolean(item.read_at),
}));

const ReadBadge = ({ read }) => (
  <span className={`inline-flex items-center gap-2 border px-3 py-1.5 text-xs font-black uppercase ${
    read
      ? 'border-teal-200 bg-teal-50 text-teal-800'
      : 'border-amber-200 bg-amber-50 text-amber-800'
  }`}>
    {read ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
    {read ? 'Read' : 'Unread'}
  </span>
);

const LoadingBlock = ({ label }) => (
  <div className="flex min-h-[260px] items-center justify-center">
    <div className="text-center">
      <div className="professional-loader mx-auto" />
      <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  </div>
);

const EmptyBlock = () => (
  <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
    <div>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[8px] bg-slate-100 text-slate-500">
        <BellAlertIcon className="h-8 w-8" />
      </span>
      <h3 className="mt-5 text-lg font-black text-slate-950">No notifications yet</h3>
      <p className="mt-2 text-sm font-medium text-slate-500">New HR updates will appear here automatically.</p>
    </div>
  </div>
);

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await operationsService.notifications();
      setNotifications(normalizeNotifications(data.data || []));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter(item => !item.read).length, [notifications]);
  const readCount = notifications.length - unreadCount;
  const latestUnread = notifications.find(item => !item.read);

  const markAsRead = async notification => {
    if (notification.read) return;

    try {
      await operationsService.readNotification(notification.id);
      setNotifications(prev => prev.map(item => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    if (!unreadCount) return;
    setMarkingAll(true);

    try {
      await operationsService.readAllNotifications();
      setNotifications(prev => prev.map(item => ({ ...item, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notifications');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative mx-auto w-full space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">Notifications</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="inline-flex h-11 w-fit items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!unreadCount || markingAll}
              className="inline-flex h-11 w-fit items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <EnvelopeOpenIcon className="h-4 w-4" />
              {markingAll ? 'Updating...' : 'Mark all read'}
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SharedStatCard title="Total Updates" value={notifications.length} icon={BellAlertIcon} theme="teal" />
        <SharedStatCard title="Unread" value={unreadCount} icon={ClockIcon} theme="amber" />
        <SharedStatCard title="Read" value={readCount} icon={CheckCircleIcon} theme="indigo" />
        <SharedStatCard title="Latest Unread" value={latestUnread ? latestUnread.title : 'Clear'} icon={EnvelopeOpenIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Notification Inbox</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black uppercase text-amber-800">
            <ClockIcon className="h-4 w-4" />
            {unreadCount} unread
          </span>
        </div>

        {loading ? (
          <LoadingBlock label="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyBlock />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/80 text-left text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {notifications.map(notification => (
                  <tr key={notification.id} className={notification.read ? 'hover:bg-teal-50/35' : 'bg-cyan-50/60 hover:bg-teal-50/60'}>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] ${
                          notification.read ? 'bg-slate-100 text-slate-500' : 'bg-teal-500 text-white shadow-[0_14px_30px_rgba(20,184,166,0.25)]'
                        }`}>
                          {notification.read ? <CheckCircleIcon className="h-5 w-5" /> : <BellAlertIcon className="h-5 w-5" />}
                        </span>
                        <span className="capitalize font-black text-slate-950">{notification.title}</span>
                      </div>
                    </td>
                    <td className="min-w-[280px] px-5 py-4 font-medium leading-6 text-slate-600">{notification.message}</td>
                    <td className="whitespace-nowrap px-5 py-4"><ReadBadge read={notification.read} /></td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{formatDate(notification.time)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => markAsRead(notification)}
                        disabled={notification.read}
                        className="inline-flex h-10 items-center justify-center gap-2 bg-teal-600 px-4 text-xs font-black uppercase text-white shadow-[0_12px_22px_rgba(15,118,110,0.18)] hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <EnvelopeOpenIcon className="h-4 w-4" />
                        Mark read
                      </button>
                    </td>
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
