import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { toast } from '../../utils/toast';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  UserCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const statusStyles = {
  completed: 'border-teal-200 bg-teal-50 text-teal-800',
  in_progress: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  review: 'border-amber-200 bg-amber-50 text-amber-800',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800',
  pending: 'border-slate-200 bg-slate-100 text-slate-700',
};

const priorityStyles = {
  urgent: 'border-rose-200 bg-rose-50 text-rose-800',
  high: 'border-amber-200 bg-amber-50 text-amber-800',
  medium: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  low: 'border-teal-200 bg-teal-50 text-teal-800',
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isAssignedEmployee = user?.employee?.id === task?.assigned_to?.id;
  const canUpdateTask = isAssignedEmployee && user?.role_id === 4;
  const canEditTask = [1, 2, 3].includes(user?.role_id);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/tasks/${id}`);
      setTask(response.data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleDownloadAttachment = async () => {
    try {
      const response = await api.get(`/tasks/${id}/download-attachment`, { responseType: 'blob' });
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch?.[1] || task.attachment_path?.split('/').pop() || 'attachment';

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading attachment:', err);
      toast.error(err.response?.status === 403 ? 'You are not authorized to download this attachment' : 'Error downloading attachment');
    }
  };

  const handleAddComment = async event => {
    event.preventDefault();
    if (!comment.trim()) return;

    try {
      await api.post(`/tasks/${id}/comments`, { comment });
      setComment('');
      fetchTask();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Error adding comment: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  const handleProgressUpdate = async newProgress => {
    if (!canUpdateTask) {
      toast.error('Only assigned employees can update progress');
      return;
    }

    try {
      await api.put(`/tasks/${id}`, { progress: newProgress });
      fetchTask();
    } catch (err) {
      console.error('Error updating task progress:', err);
      toast.error('Error updating task progress');
    }
  };

  const handleStatusChange = async newStatus => {
    if (!canUpdateTask) {
      toast.error('Only assigned employees can update task status');
      return;
    }

    try {
      setIsUpdating(true);
      await api.put(`/tasks/${id}`, { status: newStatus });
      fetchTask();
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Error updating task status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Tasks
        </button>
        <div className="border-l-4 border-rose-500 bg-rose-50 p-6 text-center text-rose-800 shadow-lg">
          <XCircleIcon className="mx-auto h-10 w-10" />
          <h3 className="mt-3 text-lg font-black">{error || 'Task not found'}</h3>
          <p className="mt-1 text-sm font-medium">The task does not exist or you do not have permission to view it.</p>
          <button onClick={fetchTask} className="mt-4 bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progress = Number(task.progress || 0);
  const overdue = task.is_overdue || (task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed');

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[10px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10">
          <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 hover:bg-white/15">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Tasks
          </button>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-teal-200/80">Task detail</p>
              <h1 className="mt-2 text-3xl font-black">{task.title}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-cyan-50/75">{task.description || 'No description provided.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEditTask && (
                <button
                  type="button"
                  onClick={() => navigate(`/tasks/${id}/edit`)}
                  className="inline-flex items-center gap-2 bg-teal-400 px-3 py-2 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Edit Task
                </button>
              )}
              <Badge style={statusStyles[task.status]}>{task.status || 'pending'}</Badge>
              <Badge style={priorityStyles[task.priority]}>{task.priority || 'medium'}</Badge>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <PanelHeader title="Task Overview" subtitle="Assignment and progress information" />
          <div className="space-y-6 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoItem icon={UserCircleIcon} label="Assigned To" value={task.assigned_to?.user?.name || 'Unknown'} />
              <InfoItem icon={UserCircleIcon} label="Assigned By" value={task.assigned_by?.name || 'Unknown'} />
              <InfoItem icon={CalendarDaysIcon} label="Due Date" value={`${formatDate(task.due_date)}${overdue ? ' (Overdue)' : ''}`} danger={overdue} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ClockIcon className="h-4 w-4 text-teal-700" />
                  Progress
                </span>
                <span className="text-lg font-black text-slate-950">{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              {canUpdateTask && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(value => (
                    <button key={value} onClick={() => handleProgressUpdate(value)} className="bg-slate-100 px-2 py-2 text-sm font-black text-slate-700 hover:bg-teal-50 hover:text-teal-800">
                      {value}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {canUpdateTask && (
              <div className="border border-teal-100 bg-teal-50 p-4">
                <h3 className="text-sm font-black text-slate-900">Update Task Status</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusButton hidden={task.status === 'pending'} disabled={isUpdating} onClick={() => handleStatusChange('pending')}>Pending</StatusButton>
                  <StatusButton hidden={task.status === 'in_progress'} disabled={isUpdating} onClick={() => handleStatusChange('in_progress')}>In Progress</StatusButton>
                  <StatusButton hidden={task.status === 'review'} disabled={isUpdating} onClick={() => handleStatusChange('review')}>Review</StatusButton>
                  <StatusButton hidden={task.status === 'completed'} disabled={isUpdating} onClick={() => handleStatusChange('completed')}>Completed</StatusButton>
                </div>
              </div>
            )}

            {task.attachment_path && (
              <div className="flex flex-col gap-3 border border-indigo-100 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <DocumentArrowDownIcon className="h-8 w-8 text-indigo-700" />
                  <div>
                    <p className="text-sm font-black text-slate-900">{task.attachment_path.split('/').pop()}</p>
                    <p className="text-xs font-medium text-slate-500">Attachment available</p>
                  </div>
                </div>
                <button onClick={handleDownloadAttachment} className="inline-flex items-center justify-center gap-2 bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-700">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <PanelHeader title="Comments" subtitle={`${task.comments?.length || 0} updates`} />
          <div className="space-y-5 p-5">
            <form onSubmit={handleAddComment} className="space-y-3">
              <textarea
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Add a comment..."
                className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                rows="3"
              />
              <button type="submit" className="inline-flex items-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
                <PaperAirplaneIcon className="h-4 w-4" />
                Add Comment
              </button>
            </form>

            <div className="space-y-4">
              {task.comments?.length ? task.comments.map(item => (
                <div key={item.id} className="border-l-4 border-teal-500 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-slate-900">{item.user?.name || 'Unknown User'}</p>
                    <span className="text-xs font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{item.comment}</p>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">No comments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function PanelHeader({ title, subtitle }) {
  return (
    <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function InfoItem({ icon, label, value, danger }) {
  return (
    <div className="border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {React.createElement(icon, { className: danger ? 'h-4 w-4 text-rose-600' : 'h-4 w-4 text-teal-700' })}
        {label}
      </div>
      <p className={`mt-2 text-sm font-black ${danger ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function StatusButton({ hidden, children, ...props }) {
  if (hidden) return null;
  return (
    <button {...props} className="bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-teal-600 hover:text-white disabled:opacity-50">
      {children}
    </button>
  );
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style || 'border-slate-200 bg-slate-100 text-slate-700'}`}>{String(children).replace('_', ' ')}</span>;
}

function formatDate(date) {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default TaskDetail;
