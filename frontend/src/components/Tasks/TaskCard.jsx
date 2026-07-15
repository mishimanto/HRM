import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../utils/toast';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  UserCircleIcon,
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

const TaskCard = ({ task, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  const assignedToId = typeof task.assigned_to === 'object' ? task.assigned_to?.id : task.assigned_to;
  const assignedUser = typeof task.assigned_to === 'object' ? task.assigned_to?.user : task.assigned_to_user;
  const assignedName = assignedUser?.name || task.assigned_to?.name || 'Unassigned';
  const canUpdateProgress = user?.employee?.id === assignedToId && user?.role_id === 4;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
  const progress = Number(task.progress || 0);
  const canEditTask = [1, 2, 3].includes(user?.role_id);

  const handleProgressChange = async newProgress => {
    try {
      if (!canUpdateProgress) {
        toast.error('Only assigned employees can update progress');
        return;
      }

      setIsUpdating(true);
      await onUpdate(task.id, { progress: newProgress });
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Error updating task progress');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-[8px] border bg-white/90 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isOverdue ? 'border-rose-200' : 'border-white/70'}`}>
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${isOverdue ? 'from-rose-500 via-pink-400 to-amber-300' : 'from-teal-500 via-cyan-400 to-amber-300'}`} />
      <div className={`absolute bottom-0 right-0 h-20 w-28 -skew-x-12 ${isOverdue ? 'bg-rose-700/10' : 'bg-teal-700/10'}`} />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/tasks/${task.id}`} className="line-clamp-2 text-lg font-black text-slate-950 hover:text-teal-700">
            {task.title}
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge style={statusStyles[task.status]}>{task.status || 'pending'}</Badge>
            <Badge style={priorityStyles[task.priority]}>{task.priority || 'medium'}</Badge>
          </div>
        </div>

        <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-500">
          {task.description || 'No description provided for this task.'}
        </p>

        <div className="grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{assignedName}</p>
              <p className="mt-1 truncate text-xs font-medium text-slate-500">{task.department?.name || 'No department'}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 sm:justify-end ${isOverdue ? 'text-rose-700' : 'text-slate-600'}`}>
            {isOverdue ? <ExclamationTriangleIcon className="h-5 w-5" /> : <CalendarDaysIcon className="h-5 w-5" />}
            <div className="text-right">
              <p className="text-sm font-black">{formatDate(task.due_date)}</p>
              <p className="text-xs font-bold">{isOverdue ? 'Overdue' : 'Due date'}</p>
            </div>
          </div>
        </div>

        {task.attachment_path && (
          <div className="flex items-center gap-3 border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800">
            <DocumentIcon className="h-5 w-5" />
            <span>File attached</span>
            <span className="ml-auto bg-white px-2 py-1 text-xs text-indigo-700 shadow-sm">{task.attachment_path.split('.').pop()?.toUpperCase()}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <ClockIcon className="h-4 w-4 text-teal-700" />
              Task Progress
            </span>
            <span className="text-lg font-black text-slate-950">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-300 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {canUpdateProgress && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[25, 50, 75, 100].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleProgressChange(value)}
                  disabled={isUpdating}
                  className="bg-slate-100 px-2 py-2 text-sm font-black text-slate-700 hover:bg-teal-50 hover:text-teal-800 disabled:opacity-50"
                >
                  {value}%
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          {canEditTask && (
            <Link to={`/tasks/${task.id}/edit`} className="mr-2 inline-flex items-center gap-2 bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
              <PencilSquareIcon className="h-4 w-4" />
              Edit
            </Link>
          )}
          <Link to={`/tasks/${task.id}`} className="inline-flex items-center gap-2 bg-teal-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
            View Details
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

function Badge({ children, style }) {
  return (
    <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
      {String(children).replace('_', ' ')}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default TaskCard;
