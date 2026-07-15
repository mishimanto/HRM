import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { operationsService } from '../../../services/operationsService';

const NotificationBell = () => {
  const { user } = useAuth();
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const normalizeNotifications = records => records.map(item => ({
    id: item.id,
    title: item.type.replaceAll('.', ' '),
    message: item.data?.message || item.data?.status || 'Your request has been updated',
    time: item.created_at,
    read: Boolean(item.read_at),
  }));

  useEffect(() => {
    if (user) {
      operationsService.notifications().then(({ data }) => {
        const records = normalizeNotifications(data.data || []);
        setNotifications(records);
        setUnreadCount(records.filter(item => !item.read).length);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!showDropdown) return undefined;

    const closeOnOutsideClick = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setShowDropdown(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showDropdown]);

  const markAsRead = async id => {
    const notification = notifications.find(item => item.id === id);
    if (!notification) return;

    if (!notification?.read && typeof id === 'string') {
      await operationsService.readNotification(id).catch(() => {});
    }
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    if (!notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    await operationsService.readAllNotifications().catch(() => {});
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(value => !value)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
        aria-label="Open notifications"
        aria-expanded={showDropdown}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:w-96">
          <div className="border-b border-slate-200 bg-slate-50/90 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">Notifications</h3>                
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700 hover:text-teal-500"
                >
                  Read all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer border-b border-slate-100 p-4 transition hover:bg-teal-50/70 ${
                    !notification.read ? 'bg-cyan-50/80' : 'bg-white'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="capitalize text-sm font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {new Date(notification.time).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.14)]"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setShowDropdown(false)}
            className="block bg-slate-950 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-teal-700"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
