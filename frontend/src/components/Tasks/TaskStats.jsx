import React, { useCallback, useEffect, useState } from 'react';
import SharedStatCard from '../UI/StatCard';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const normalizeRows = response => response.data?.data || response.data || [];

const TaskStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = user?.role_id === 4 ? await api.get('/my-tasks') : await api.get('/tasks');
      const tasks = normalizeRows(response);
      const now = new Date();

      setStats({
        total: tasks.length,
        pending: tasks.filter(task => task.status === 'pending').length,
        in_progress: tasks.filter(task => task.status === 'in_progress').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        overdue: tasks.filter(task => task.due_date && new Date(task.due_date) < now && !['completed', 'cancelled'].includes(task.status)).length,
      });
    } catch (err) {
      console.error('Error fetching task stats:', err);
      setError('Failed to load task statistics');
    } finally {
      setLoading(false);
    }
  }, [user?.role_id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-[150px] animate-pulse rounded-[8px] border border-slate-200 bg-white/70" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm font-bold text-amber-800 shadow-lg">
        <span className="flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5" />
          {error}
        </span>
        <button onClick={fetchStats} className="bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-400">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard label="Total Tasks" value={stats.total} icon={ClipboardDocumentListIcon} theme="teal" />
      <SummaryCard label="Pending" value={stats.pending} icon={ClockIcon} theme="amber" />
      <SummaryCard label="In Progress" value={stats.in_progress} icon={RocketLaunchIcon} theme="indigo" />
      <SummaryCard label="Completed" value={stats.completed} icon={CheckCircleIcon} theme="teal" />
      <SummaryCard label="Overdue" value={stats.overdue} icon={ExclamationTriangleIcon} theme="rose" />
    </div>
  );
};

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

export default TaskStats;
