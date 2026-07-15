import React from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TaskFilters = ({ filters, onFilterChange, departments = [], userRole }) => {
  const isEmployee = userRole === 4;

  const handleFilterChange = (filterType, value) => {
    onFilterChange(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      priority: 'all',
      ...(!isEmployee && { department_id: 'all' }),
    });
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Task Filters</h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
          <FunnelIcon className="h-4 w-4" />
          Filters
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <FilterField label="Status">
          <select
            value={filters.status}
            onChange={event => handleFilterChange('status', event.target.value)}
            className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </FilterField>

        <FilterField label="Priority">
          <select
            value={filters.priority}
            onChange={event => handleFilterChange('priority', event.target.value)}
            className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </FilterField>

        {!isEmployee && (
          <FilterField label="Department">
            <select
              value={filters.department_id}
              onChange={event => handleFilterChange('department_id', event.target.value)}
              className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </FilterField>
        )}

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-slate-100 px-4 text-sm font-black text-slate-700 hover:bg-slate-200"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear Filters
          </button>
        </div>
      </div>
    </section>
  );
};

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default TaskFilters;
