import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import TaskForm from '../../components/Tasks/TaskForm';

const TaskFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  const fetchTask = useCallback(async () => {
    if (!isEdit) return;

    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleSubmit = async formData => {
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };

    if (isEdit) {
      formData.append('_method', 'PUT');
      await api.post(`/tasks/${id}`, formData, config);
      navigate(`/tasks/${id}`);
      return;
    }

    await api.post('/tasks', formData, config);
    navigate('/tasks');
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading task form...</p>
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
            <h1 className="text-3xl font-black">{isEdit ? 'Edit Task' : 'Create Task'}</h1>            
          </div>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/tasks/${id}` : '/tasks')}
            className="inline-flex h-11 items-center gap-2 bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/15"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && (
        <div className="border-l-4 border-rose-500 bg-rose-50 p-4 text-sm font-bold text-rose-800 shadow-lg">
          {error}
        </div>
      )}

      <TaskForm
        initialData={task}
        onSubmit={handleSubmit}
        onCancel={() => navigate(isEdit ? `/tasks/${id}` : '/tasks')}
      />
    </div>
  );
};

export default TaskFormPage;
