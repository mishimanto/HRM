import React, { useState, useEffect } from 'react';
import SharedStatCard from '../../components/UI/StatCard';
import ToastAlert from '../../components/UI/ToastAlert';
import { departmentService } from '../../services/departmentService';
import { userService } from '../../services/userService';
import { confirmDialog } from '../../utils/dialog';
import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_id: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.data.filter(user => user.role?.slug === 'manager' || user.role?.slug === 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment.id, formData);
      } else {
        await departmentService.create(formData);
      }
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        manager_id: '',
      });
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      setError(error.response?.data?.message || 'Unable to save department');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      manager_id: department.manager_id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete department?',
      text: 'Employees and positions linked to this department may be affected.',
      confirmButtonText: 'Delete department',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await departmentService.delete(id);
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      setError(error.response?.data?.message || 'Unable to delete department');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="professional-loader" />
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
            <h1 className="text-3xl font-black">Departments</h1>
          </div>
          <button
            onClick={() => {
              setEditingDepartment(null);
              setFormData({ name: '', description: '', manager_id: '' });
              setShowModal(true);
            }}
            className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-[#0f2137] shadow-[0_14px_26px_rgba(20,184,166,0.28)] transition hover:-translate-y-0.5 hover:bg-teal-300"
          >
            <PlusIcon className="h-4 w-4" />
            Add Department
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <ToastAlert type="error" message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Departments" value={departments.length} icon={BuildingOffice2Icon} theme="teal" />
        <SummaryCard label="Employees" value={departments.reduce((sum, dept) => sum + (dept.employees?.length || 0), 0)} icon={UserGroupIcon} theme="indigo" />
        <SummaryCard label="Positions" value={departments.reduce((sum, dept) => sum + (dept.positions?.length || 0), 0)} icon={BriefcaseIcon} theme="amber" />
        <SummaryCard label="Managers" value={departments.filter(dept => dept.manager).length} icon={UserCircleIcon} theme="rose" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {departments.map((department) => (
          <div key={department.id} className="relative overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
            <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-amber-300" />
            <div className="absolute bottom-0 right-0 h-20 w-28 -skew-x-12 bg-teal-700/10" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-teal-600 text-white shadow-[0_12px_24px_rgba(15,118,110,0.24)]">
                    <BuildingOffice2Icon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black text-slate-950">{department.name}</h3>
                    <p className="mt-1 text-xs font-bold uppercase text-slate-500">Department unit</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(department)}
                    className="border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-md"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-5 min-h-12 text-sm leading-6 text-slate-600">
                {department.description || 'No description provided.'}
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                <InfoRow label="Manager" value={department.manager ? department.manager.name : 'Not assigned'} />
                <InfoRow label="Employees" value={department.employees?.length || 0} />
                <InfoRow label="Positions" value={department.positions?.length || 0} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="rounded-[8px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.09)]">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-900">No departments</h3>
          <p className="mt-1 text-sm text-slate-500">Create your first department to start organizing employees.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="app-modal-backdrop">
            <div className="w-full max-w-xl overflow-hidden rounded-[10px] border border-white/20 bg-white shadow-2xl">
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] px-6 py-5 text-white">
                <div className="absolute bottom-0 right-0 h-20 w-48 -skew-x-12 bg-white/10" />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-teal-200/80">Department setup</p>
                    <h3 className="mt-1 text-xl font-black">{editingDepartment ? 'Edit Department' : 'Add New Department'}</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingDepartment(null);
                    }}
                    className="flex h-9 w-9 items-center justify-center border border-white/20 bg-white/10 hover:bg-white/15"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 h-11 w-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-2 block w-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500">Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="mt-2 h-11 w-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="">Select Manager</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.role?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDepartment(null);
                    }}
                    className="h-10 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 bg-teal-600 px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700"
                  >
                    {editingDepartment ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
};

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-3 py-2 shadow-sm">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <span className="max-w-[12rem] truncate text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

export default Departments;
