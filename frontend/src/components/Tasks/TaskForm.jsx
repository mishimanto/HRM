import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { toast } from '../../utils/toast';
import { DocumentIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const TaskForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    department_id: '',
    priority: 'medium',
    due_date: '',
    attachment: null,
  });
  const [departments, setDepartments] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);

  const fetchEmployeesByDepartment = useCallback(async departmentId => {
    try {
      const response = await api.get(`/departments/${departmentId}/employees`);
      setFilteredEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setFilteredEmployees([]);
    }
  }, []);

  const fetchFormData = useCallback(async () => {
    try {
      const departmentsRes = await api.get('/departments');
      setDepartments(departmentsRes.data.data || departmentsRes.data);

      if (formData.department_id) {
        await fetchEmployeesByDepartment(formData.department_id);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  }, [fetchEmployeesByDepartment, formData.department_id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        assigned_to: initialData.assigned_to?.id || initialData.assigned_to || '',
        department_id: initialData.department?.id || initialData.department_id || '',
        priority: initialData.priority || 'medium',
        due_date: initialData.due_date || '',
        attachment: null,
      });
    }
    fetchFormData();
  }, [fetchFormData, initialData]);

  const handleChange = event => {
    const { name, value, files } = event.target;

    if (name === 'department_id') {
      setFormData(prev => ({ ...prev, [name]: value, assigned_to: '' }));
      if (value) fetchEmployeesByDepartment(value);
      else setFilteredEmployees([]);
      return;
    }

    if (name === 'attachment') {
      const file = files[0];
      setFormData(prev => ({ ...prev, attachment: file }));

      if (!file) {
        setFilePreview(null);
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setFilePreview({ type: 'image', url: e.target.result, name: file.name });
        reader.readAsDataURL(file);
      } else {
        setFilePreview({ type: 'file', name: file.name });
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description || '');
    submitData.append('assigned_to', formData.assigned_to);
    submitData.append('department_id', formData.department_id || '');
    submitData.append('priority', formData.priority);
    submitData.append('due_date', formData.due_date);
    if (initialData?.status) submitData.append('status', initialData.status);

    if (formData.attachment) submitData.append('attachment', formData.attachment);

    try {
      await onSubmit(submitData);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        department_id: '',
        priority: 'medium',
        due_date: '',
        attachment: null,
      });
      setFilePreview(null);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Error creating task: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({ ...prev, attachment: null }));
    setFilePreview(null);
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{initialData ? 'Edit Task' : 'Create New Task'}</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <Field label="Task Title *">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              placeholder="Enter task title"
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              placeholder="Enter task description"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Department *">
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="">Select Department</option>
                {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </select>
            </Field>

            <Field label="Assign To *">
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required
                disabled={!formData.department_id}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">{formData.department_id ? 'Select Employee' : 'Select department first'}</option>
                {filteredEmployees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Priority *">
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>

            <Field label="Due Date *">
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                min={initialData ? undefined : new Date().toISOString().split('T')[0]}
                className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
              />
            </Field>
          </div>

          <Field label="Attachment">
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none file:mr-4 file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-teal-800 hover:file:bg-teal-100 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
            />
            <p className="mt-2 text-xs font-medium text-slate-500">Supported formats: PDF, JPG, PNG, TXT, DOC, DOCX.</p>
          </Field>

          {filePreview && (
            <div className="flex items-center justify-between border border-indigo-100 bg-indigo-50 p-3">
              <div className="flex items-center gap-3">
                {filePreview.type === 'image' ? (
                  <img src={filePreview.url} alt="Preview" className="h-12 w-12 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center bg-white text-indigo-700">
                    <DocumentIcon className="h-6 w-6" />
                  </div>
                )}
                <span className="text-sm font-bold text-slate-700">{filePreview.name || 'Image preview'}</span>
              </div>
              <button type="button" onClick={removeAttachment} className="text-sm font-black text-rose-700 hover:text-rose-800">
                Remove
              </button>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700 disabled:opacity-50">
              <PaperAirplaneIcon className="h-4 w-4" />
              {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
    </section>
  );
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default TaskForm;
