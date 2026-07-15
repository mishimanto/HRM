import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import TaskCard from '../../components/Tasks/TaskCard';
import TaskFilters from '../../components/Tasks/TaskFilters';
import TaskStats from '../../components/Tasks/TaskStats';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const normalizeRows = response => response.data?.data || response.data || [];

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
  });

  const fetchMyTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);

      const response = await api.get(`/my-tasks?${params}`);
      setTasks(normalizeRows(response));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await api.put(`/tasks/${taskId}`, updates);
      fetchMyTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading your tasks...</p>
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
            <p className="text-xs font-bold uppercase text-teal-200/80">Personal task desk</p>
            <h1 className="mt-2 text-3xl font-black">My Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-cyan-50/75">
              Track your assigned work, update progress and keep task status current.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Active</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Due</span>
            </div>
            <span className="border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85">{tasks.length} Tasks</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      <TaskStats />
      <TaskFilters filters={filters} onFilterChange={setFilters} userRole={4} />

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Assigned Tasks</h2>
            <p className="mt-1 text-sm text-slate-500">Your current task queue</p>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {tasks.length} tasks
          </span>
        </div>

        <div className="grid gap-5 p-5">
          {tasks.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No tasks assigned</h3>
              <p className="mt-1 text-sm text-slate-500">You are all caught up for now.</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleUpdateTask}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default MyTasks;
