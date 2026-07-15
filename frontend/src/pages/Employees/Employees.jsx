import React, { useCallback, useEffect, useState } from 'react';
import SharedStatCard from '../../components/UI/StatCard';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { toast } from '../../utils/toast';
import { confirmDialog } from '../../utils/dialog';
import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const Employees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((message, type = 'success') => {
    const notify = toast[type] || toast.info;
    notify(message);
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToast('Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleEdit = (employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: 'Delete employee?',
      text: 'This employee record and linked user account will be removed.',
      confirmButtonText: 'Delete employee',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await employeeService.delete(id);
      showToast('Employee deleted successfully!', 'success');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      const errorMessage = error.response?.data?.message || 'Error deleting employee';
      showToast(errorMessage, 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(employee => employee.user?.is_active !== false).length;
  const assignedDepartments = new Set(employees.map(employee => employee.department?.name).filter(Boolean)).size;
  const monthlySalary = employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);

  const getEmployeeImage = (employee) => (
    employee.user?.profile_photo_url
    || employee.user?.profile_image_url
    || employee.user?.avatar_url
    || employee.user?.photo_url
    || employee.profile_photo_url
    || employee.profile_image_url
    || employee.avatar_url
    || employee.photo_url
    || null
  );

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
            <h1 className="text-3xl font-black">Employees</h1>
          </div>
        <button
          onClick={() => navigate('/employees/create')}
            className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-[#0f2137] shadow-[0_14px_26px_rgba(20,184,166,0.28)] transition hover:-translate-y-0.5 hover:bg-teal-300"
        >
            <PlusIcon className="h-4 w-4" />
          Add Employee
        </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Employees" value={totalEmployees} icon={UserGroupIcon} theme="teal" />
        <SummaryCard label="Active Records" value={activeEmployees} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Departments" value={assignedDepartments} icon={BuildingOffice2Icon} theme="amber" />
        <SummaryCard label="Monthly Payroll" value={`BDT ${monthlySalary.toLocaleString()}`} icon={BanknotesIcon} theme="rose" />
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Employee Directory</h2>
          </div>
          <span className="w-fit border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
            {employees.length} records
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Employee ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Employee Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Position
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Joining Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Salary
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80">
              {employees.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-teal-50/40">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 shadow-sm">
                      {employee.user?.employee_id || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center min-w-[200px]">
                      <EmployeeAvatar employee={employee} src={getEmployeeImage(employee)} />
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {employee.user?.name || 'No Name'}
                        </div>
                        <div className="text-sm text-slate-500 truncate">
                          {employee.user?.email || 'No Email'}
                        </div>
                        <div className="text-sm text-slate-400 truncate">
                          {employee.user?.phone || 'No Phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-bold shadow-sm ${
                      employee.department?.name
                        ? 'border-teal-200 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}>
                      {employee.department?.name || 'Not Assigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 min-w-[150px]">
                    <div className="truncate max-w-[200px]" title={employee.position?.title}>
                      {employee.position?.title || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${
                      employee.employment_type === 'full-time' ? 'border-indigo-200 bg-indigo-50 text-indigo-800' :
                      employee.employment_type === 'part-time' ? 'border-amber-200 bg-amber-50 text-amber-800' :
                      employee.employment_type === 'contract' ? 'border-orange-200 bg-orange-50 text-orange-800' :
                      'border-slate-200 bg-slate-100 text-slate-700'
                    }`}>
                      {employee.employment_type?.replace('-', ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                    {formatDate(employee.joining_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900">
                    BDT {Number(employee.salary || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="inline-flex items-center border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-md"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="inline-flex items-center border border-rose-200 bg-rose-50 p-2 text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-md"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {employees.length === 0 && (
          <div className="text-center py-12">
            <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new employee.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/employees/create')}
                className="inline-flex items-center bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-teal-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Employee
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for custom scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function EmployeeAvatar({ employee, src }) {
  const [imageSrc, setImageSrc] = useState(src || placeholderUserImage);
  const name = employee.user?.name || 'Employee';

  useEffect(() => {
    setImageSrc(src || placeholderUserImage);
  }, [src]);

  return (
    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-slate-100 shadow-[0_12px_22px_rgba(15,118,110,0.18)] ring-2 ring-teal-100">
      <img
        src={imageSrc}
        alt={`${name} profile`}
        onError={() => setImageSrc(placeholderUserImage)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

const placeholderUserImage = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ccfbf1"/>
      <stop offset="0.55" stop-color="#e0f2fe"/>
      <stop offset="1" stop-color="#fef3c7"/>
    </linearGradient>
    <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f766e"/>
      <stop offset="1" stop-color="#0f2137"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="18" fill="url(#bg)"/>
  <circle cx="48" cy="35" r="18" fill="url(#fg)" opacity="0.92"/>
  <path d="M18 82c4.8-19 17-29 30-29s25.2 10 30 29" fill="url(#fg)" opacity="0.92"/>
  <path d="M19 82h58" stroke="#14b8a6" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
</svg>
`)}`;

export default Employees;
