import React, { useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  IdentificationIcon,
  LockClosedIcon,
  PencilIcon,
  PlusIcon,
  UserCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { positionService } from '../../services/positionService';
import { roleService } from '../../services/roleService';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  employee_id: '',
  department_id: '',
  position_id: '',
  salary: '',
  employment_type: 'full-time',
  joining_date: '',
  role_id: '4',
  password: '',
  confirm_password: '',
};

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [formData, setFormData] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredPositions = useMemo(() => {
    if (!formData.department_id) return [];
    return positions.filter(position => Number(position.department_id) === Number(formData.department_id));
  }, [formData.department_id, positions]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [departmentResponse, positionResponse, roleResponse] = await Promise.all([
          departmentService.getAll(),
          positionService.getAll(),
          roleService.getAll(),
        ]);
        setDepartments(departmentResponse.data || []);
        setPositions(positionResponse.data || []);
        setRoles(roleResponse.data || []);

        if (isEdit) {
          const employeeResponse = await employeeService.getById(id);
          const employee = employeeResponse.data?.data || employeeResponse.data;
          setFormData({
            name: employee.user?.name || '',
            email: employee.user?.email || '',
            phone: employee.user?.phone || '',
            employee_id: employee.user?.employee_id || '',
            department_id: employee.department_id ? String(employee.department_id) : '',
            position_id: employee.position_id ? String(employee.position_id) : '',
            salary: employee.salary || '',
            employment_type: employee.employment_type || 'full-time',
            joining_date: employee.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : '',
            role_id: employee.user?.role_id ? String(employee.user.role_id) : '4',
            password: '',
            confirm_password: '',
          });
        }
      } catch (err) {
        console.error('Error loading employee form:', err);
        setError(err.response?.data?.message || 'Unable to load employee form');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!formData.role_id) {
      setError('Please select a role');
      return;
    }

    if (!isEdit && formData.password && formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (!isEdit && formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      employee_id: formData.employee_id,
      department_id: formData.department_id || null,
      position_id: formData.position_id || null,
      salary: Number(formData.salary || 0),
      employment_type: formData.employment_type,
      joining_date: formData.joining_date,
      role_id: formData.role_id,
    };

    if (!isEdit && formData.password) payload.password = formData.password;

    setSaving(true);
    try {
      if (isEdit) {
        await employeeService.update(id, payload);
        setMessage('Employee updated successfully');
      } else {
        await employeeService.create(payload);
        setMessage('Employee created successfully');
      }
      setTimeout(() => navigate('/employees'), 700);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err.response?.data?.message || err.message || 'Unable to save employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading employee form...</p>
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
            <h1 className="text-3xl font-black">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>            
          </div>
          <button onClick={() => navigate('/employees')} className="inline-flex h-11 items-center gap-2 border border-white/20 bg-white/10 px-4 text-sm font-bold text-white shadow-lg hover:bg-white/15">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to list
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection icon={UserCircleIcon} title="Personal Information" theme="teal">
          <Field label="Full Name" required value={formData.name} onChange={value => update('name', value)} />
          <Field label="Email Address" type="email" required value={formData.email} onChange={value => update('email', value)} />
          <Field label="Phone Number" required value={formData.phone} onChange={value => update('phone', value)} />
          <Field label="Employee ID" required value={formData.employee_id} onChange={value => update('employee_id', value)} />
        </FormSection>

        <FormSection icon={LockClosedIcon} title={isEdit ? 'Role Information' : 'Role & Login Credentials'} theme="amber">
          <Select label="Role" required value={formData.role_id} onChange={value => update('role_id', value)}>
            <option value="">Select Role</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </Select>
          {!isEdit && (
            <>
              <Field label="Password" type="password" value={formData.password} onChange={value => update('password', value)} helper="Optional. Minimum 8 characters. If empty, system may generate one." />
              <Field label="Confirm Password" type="password" value={formData.confirm_password} onChange={value => update('confirm_password', value)} />
            </>
          )}
        </FormSection>

        <FormSection icon={BriefcaseIcon} title="Employment Information" theme="indigo">
          <Select label="Department" value={formData.department_id} onChange={value => {
            update('department_id', value);
            update('position_id', '');
          }}>
            <option value="">Select Department</option>
            {departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
          </Select>
          <Select label="Position" value={formData.position_id} onChange={value => update('position_id', value)} disabled={!formData.department_id}>
            <option value="">{formData.department_id ? 'Select Position' : 'First select a department'}</option>
            {filteredPositions.map(position => <option key={position.id} value={position.id}>{position.title}</option>)}
          </Select>
          <Select label="Employment Type" value={formData.employment_type} onChange={value => update('employment_type', value)}>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </Select>
          <Field label="Salary" type="number" required value={formData.salary} onChange={value => update('salary', value)} prefix="BDT" />
          <Field label="Joining Date" type="date" required value={formData.joining_date} onChange={value => update('joining_date', value)} />
        </FormSection>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => navigate('/employees')} disabled={saving} className="h-11 border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 bg-teal-600 px-5 text-sm font-black text-white shadow-[0_14px_26px_rgba(15,118,110,0.24)] hover:bg-teal-700 disabled:opacity-60">
            {saving ? (
              <>
                <span className="inline-loader text-teal-600" />
                Saving...
              </>
            ) : (
              <>
                {isEdit ? <PencilIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                {isEdit ? 'Update Employee' : 'Create Employee'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function FormSection({ icon, title, subtitle, theme, children }) {
  const styles = {
    teal: 'from-teal-500 via-cyan-400 to-amber-300 bg-teal-600 shadow-[0_12px_24px_rgba(15,118,110,0.24)]',
    amber: 'from-amber-400 via-orange-400 to-teal-300 bg-amber-400 text-slate-950 shadow-[0_12px_24px_rgba(180,83,9,0.22)]',
    indigo: 'from-indigo-500 via-sky-400 to-amber-300 bg-indigo-600 shadow-[0_12px_24px_rgba(67,56,202,0.24)]',
  }[theme];

  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className={`h-1.5 bg-gradient-to-r ${styles.split(' ')[0]} ${styles.split(' ')[1]} ${styles.split(' ')[2]}`} />
      <div className="border-b border-slate-200/80 bg-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className={`flex items-center justify-center`}>
            {React.createElement(icon, { className: 'h-5 w-5' })}
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, helper, prefix }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}{required ? ' *' : ''}</span>
      <div className="relative mt-2">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">{prefix}</span>}
        <input
          type={type}
          required={required}
          value={value}
          step={type === 'number' ? '0.01' : undefined}
          onChange={event => onChange(event.target.value)}
          className={`h-11 w-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 ${prefix ? 'pl-14' : ''}`}
        />
      </div>
      {helper && <span className="mt-1 block text-xs font-medium text-slate-500">{helper}</span>}
    </label>
  );
}

function Select({ label, value, onChange, required = false, disabled = false, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}{required ? ' *' : ''}</span>
      <select
        required={required}
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 h-11 w-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>
    </label>
  );
}
