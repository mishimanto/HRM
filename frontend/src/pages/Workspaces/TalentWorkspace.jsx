import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  RocketLaunchIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { talentService } from '../../services/workspaceService';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';

const tabs = [
  ['requisitions', 'Requisitions'],
  ['applications', 'Applications'],
  ['interviews', 'Interviews'],
  ['onboarding', 'Onboarding'],
  ['onboarding_tasks', 'Onboarding tasks'],
  ['performance_cycles', 'Cycles'],
  ['performance_goals', 'Goals'],
  ['performance_reviews', 'Reviews'],
  ['training_courses', 'Courses'],
  ['training_enrollments', 'Enrollments'],
  ['offboarding', 'Offboarding'],
  ['offboarding_clearances', 'Clearances'],
];

const activeTabLabel = key => tabs.find(tab => tab[0] === key)?.[1] || 'Records';

const statusTone = status => {
  const value = String(status || 'active').toLowerCase();
  if (value.includes('reject') || value.includes('cancel') || value.includes('pending')) {
    return value.includes('pending') ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-800';
  }
  if (value.includes('complete') || value === 'open' || value === 'hired' || value === 'cleared' || value === 'active') {
    return 'border-teal-200 bg-teal-50 text-teal-800';
  }
  return 'border-indigo-200 bg-indigo-50 text-indigo-800';
};

export default function TalentWorkspace() {
  const [active, setActive] = useState('requisitions');
  const [data, setData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, departmentResponse, employeeResponse] = await Promise.all([
        talentService.overview(),
        departmentService.getAll(),
        employeeService.getAll(),
      ]);
      setData(overview.data || {});
      setDepartments(departmentResponse.data?.data || departmentResponse.data || []);
      setEmployees(employeeResponse.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load talent workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => data[active] || [], [data, active]);
  const summary = useMemo(() => {
    const requisitions = data.requisitions || [];
    const applications = data.applications || [];
    const onboardingTasks = data.onboarding_tasks || [];
    const trainingEnrollments = data.training_enrollments || [];

    return {
      requisitions: requisitions.length,
      candidates: (data.candidates || []).length,
      pendingWork: onboardingTasks.filter(row => row.status !== 'completed').length,
      training: trainingEnrollments.filter(row => row.status === 'completed').length,
      openReq: requisitions.filter(row => row.status === 'open').length,
      activeApplications: applications.filter(row => !['hired', 'rejected'].includes(row.stage)).length,
    };
  }, [data]);

  const submit = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (form === 'requisition') await talentService.createRequisition({ ...values, vacancies: Number(values.vacancies), description: values.description || values.title });
      if (form === 'candidate') await talentService.createCandidate(values);
      if (form === 'application') await talentService.apply({ job_requisition_id: Number(values.job_requisition_id), candidate_id: Number(values.candidate_id) });
      if (form === 'interview') await talentService.scheduleInterview({ job_application_id: Number(values.job_application_id), type: values.type, scheduled_at: values.scheduled_at, duration_minutes: Number(values.duration_minutes), location_or_link: values.location_or_link, panel_user_ids: [Number(values.panel_user_id)] });
      if (form === 'onboarding') await talentService.startOnboarding({ employee_id: Number(values.employee_id), start_date: values.start_date, target_completion_date: values.target_completion_date || null, tasks: [{ title: values.task_title, assigned_to: Number(values.assigned_to) || null, due_date: values.task_due_date || null }] });
      if (form === 'cycle') await talentService.createCycle({ name: values.name, starts_on: values.starts_on, ends_on: values.ends_on, status: 'active' });
      if (form === 'goal') await talentService.createGoal({ performance_cycle_id: Number(values.performance_cycle_id), employee_id: Number(values.employee_id), title: values.title, weight: Number(values.weight), target_value: values.target_value ? Number(values.target_value) : null });
      if (form === 'review') await talentService.createReview({ performance_cycle_id: Number(values.performance_cycle_id), employee_id: Number(values.employee_id), review_type: values.review_type, score: values.score ? Number(values.score) : null, status: 'submitted' });
      if (form === 'course') await talentService.createCourse({ ...values, duration_hours: Number(values.duration_hours), cost: Number(values.cost || 0) });
      if (form === 'enroll') await talentService.enroll({ training_course_id: Number(values.training_course_id), employee_id: Number(values.employee_id) });
      if (form === 'offboarding') await talentService.startOffboarding({ employee_id: Number(values.employee_id), separation_type: values.separation_type, notice_date: values.notice_date, last_working_date: values.last_working_date, reason: values.reason, clearance_areas: [{ area: values.clearance_area, approver_id: Number(values.approver_id) || null }] });
      setForm(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save record');
    }
  };

  const advance = async (row, value) => {
    try {
      if (active === 'requisitions') await talentService.updateRequisitionStatus(row.id, value);
      if (active === 'applications') await talentService.updateApplicationStage(row.id, value);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not update record');
    }
  };

  const closeAction = async row => {
    try {
      if (active === 'interviews') await talentService.interviewResult(row.id, { status: 'completed', score: 100, feedback: 'Completed' });
      if (active === 'onboarding_tasks') await talentService.completeOnboardingTask(row.id);
      if (active === 'training_enrollments') await talentService.completeTraining(row.id, { score: 100 });
      if (active === 'offboarding_clearances') await talentService.updateClearance(row.id, { status: 'cleared' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not complete action');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading talent workspace...</p>
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
            <h1 className="text-3xl font-black">Talent & Lifecycle</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-3 border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-cyan-50/85 sm:flex">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-teal-400" /> Pipeline</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /> Actions</span>
            </div>
            <button title="Refresh" onClick={load} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Requisitions" value={summary.requisitions} icon={BriefcaseIcon} theme="teal" />
        <SummaryCard label="Candidates" value={summary.candidates} icon={UserGroupIcon} theme="indigo" />
        <SummaryCard label="Pending Work" value={summary.pendingWork} icon={ClockIcon} theme="amber" />
        <SummaryCard label="Training Done" value={summary.training} icon={AcademicCapIcon} theme="rose" />
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-gray-100 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Lifecycle Workflows</h2>
          </div>
          <ActionButtons active={active} setForm={setForm} />
        </div>
        <div className="overflow-x-auto border-b border-slate-200/80 bg-white/70">
          <div className="flex min-w-max">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`min-h-12 border-b-2 px-4 py-2 text-sm font-bold transition ${active === key ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
                <span className="ml-2 text-xs text-slate-400">{data[key]?.length || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <RocketLaunchIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-900">No records in this workflow</h3>
              <p className="mt-1 text-sm text-slate-500">Create a record or switch to another lifecycle tab.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/90">
                <tr>
                  <HeadCell>Record</HeadCell>
                  <HeadCell>Context</HeadCell>
                  <HeadCell>Date</HeadCell>
                  <HeadCell>Status</HeadCell>
                  <HeadCell align="right">Action</HeadCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {rows.map(row => (
                  <tr key={row.id} className="transition hover:bg-teal-50/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex min-w-[220px] items-center">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-teal-600 shadow-[0_12px_22px_rgba(15,118,110,0.25)]">
                          <UserCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{recordTitle(row)}</p>
                          <p className="mt-1 truncate text-sm text-slate-500">#{row.id} · {activeTabLabel(active)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{recordContext(row)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{recordDate(row)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge style={statusTone(row.status || row.stage)}>{row.status || row.stage || 'Active'}</Badge></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><RowAction active={active} row={row} advance={advance} closeAction={closeAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {form && (
        <TalentModal
          form={form}
          data={data}
          departments={departments}
          employees={employees}
          onClose={() => setForm(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

function ActionButtons({ active, setForm }) {
  const primary = 'inline-flex h-10 items-center gap-2 bg-teal-600 px-4 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700';
  const secondary = 'inline-flex h-10 items-center border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50';

  return (
    <div className="flex flex-wrap gap-2">
      {active === 'requisitions' && <button onClick={() => setForm('requisition')} className={primary}><PlusIcon className="h-4 w-4" />Requisition</button>}
      {active === 'applications' && (
        <>
          <button onClick={() => setForm('candidate')} className={secondary}>Candidate</button>
          <button onClick={() => setForm('application')} className={primary}><PlusIcon className="h-4 w-4" />Application</button>
        </>
      )}
      {active === 'interviews' && <button onClick={() => setForm('interview')} className={primary}><PlusIcon className="h-4 w-4" />Interview</button>}
      {active === 'onboarding' && <button onClick={() => setForm('onboarding')} className={primary}><PlusIcon className="h-4 w-4" />Onboarding</button>}
      {active === 'performance_cycles' && (
        <>
          <button onClick={() => setForm('goal')} className={secondary}>Goal</button>
          <button onClick={() => setForm('review')} className={secondary}>Review</button>
          <button onClick={() => setForm('cycle')} className={primary}>Cycle</button>
        </>
      )}
      {active === 'training_courses' && (
        <>
          <button onClick={() => setForm('enroll')} className={secondary}>Enroll</button>
          <button onClick={() => setForm('course')} className={primary}>Course</button>
        </>
      )}
      {active === 'offboarding' && <button onClick={() => setForm('offboarding')} className={primary}>Start offboarding</button>}
    </div>
  );
}

function RowAction({ active, row, advance, closeAction }) {
  if (active === 'requisitions' && row.status === 'draft') return <ActionButton onClick={() => advance(row, 'open')}>Open</ActionButton>;
  if (active === 'applications' && !['hired', 'rejected'].includes(row.stage)) return <ActionButton onClick={() => advance(row, row.stage === 'applied' ? 'screening' : 'shortlisted')}>Advance</ActionButton>;
  if (active === 'interviews' && row.status === 'scheduled') return <ActionButton onClick={() => closeAction(row)}>Complete</ActionButton>;
  if (active === 'onboarding_tasks' && row.status !== 'completed') return <ActionButton onClick={() => closeAction(row)}>Complete</ActionButton>;
  if (active === 'training_enrollments' && row.status !== 'completed') return <ActionButton onClick={() => closeAction(row)}>Complete</ActionButton>;
  if (active === 'offboarding_clearances' && row.status === 'pending') return <ActionButton onClick={() => closeAction(row)}>Clear</ActionButton>;
  return <span className="border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">No action</span>;
}

function TalentModal({ form, data, departments, employees, onClose, onSubmit }) {
  return (
    <div className="app-modal-backdrop">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[10px] border border-white/70 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">New {form.replace('_', ' ')}</h2>
          </div>
          <button type="button" title="Close" onClick={onClose} className="flex h-10 w-10 rounded-full items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <TalentForm type={form} data={data} departments={departments} employees={employees} />
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button className="inline-flex items-center gap-2 bg-teal-600 px-4 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">
            <CheckCircleIcon className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

function HeadCell({ children, align }) {
  return <th className={`px-6 py-4 text-xs font-bold uppercase text-slate-500 whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Badge({ children, style }) {
  return <span className={`inline-flex border px-2.5 py-1 text-xs font-bold capitalize shadow-sm ${style}`}>{String(children).replace('_', ' ')}</span>;
}

function ActionButton({ children, onClick }) {
  return <button onClick={onClick} className="bg-teal-600 px-3 py-2 text-sm font-black text-white shadow-[0_12px_22px_rgba(15,118,110,0.22)] hover:bg-teal-700">{children}</button>;
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}

function Field({ label, name, type = 'text', defaultValue }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input required name={name} type={type} defaultValue={defaultValue} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100" />
    </label>
  );
}

function Select({ label, name, items, value = 'id', text = 'name' }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select required name={name} className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100">
        <option value="">Select</option>
        {items.filter(item => item?.[value]).map(item => <option key={item[value]} value={item[value]}>{item[text] || item.title || item.candidate_name}</option>)}
      </select>
    </label>
  );
}

function TalentForm({ type, data, departments, employees }) {
  const employeeItems = employees.map(employee => ({ id: employee.id, name: employee.user?.name })).filter(item => item.id && item.name);
  const userItems = employees.map(employee => ({ id: employee.user?.id, name: employee.user?.name })).filter(item => item.id && item.name);

  if (type === 'requisition') return <><Field name="title" label="Job title" /><Select name="department_id" label="Department" items={departments} /><Field name="vacancies" label="Vacancies" type="number" defaultValue="1" /><Select name="employment_type" label="Employment type" value="value" text="label" items={['full-time', 'part-time', 'contract', 'intern'].map(item => ({ value: item, label: item }))} /><div className="sm:col-span-2"><Field name="description" label="Description" /></div></>;
  if (type === 'candidate') return <><Field name="name" label="Full name" /><Field name="email" label="Email" type="email" /><Field name="phone" label="Phone" /><Field name="source" label="Source" /></>;
  if (type === 'application') return <><Select name="job_requisition_id" label="Requisition" items={data.requisitions || []} text="title" /><Select name="candidate_id" label="Candidate" items={data.candidates || []} /></>;
  if (type === 'interview') return <><Select name="job_application_id" label="Application" items={data.applications || []} text="candidate_name" /><Select name="type" label="Type" value="value" text="label" items={['phone', 'video', 'onsite', 'technical', 'hr', 'final'].map(item => ({ value: item, label: item }))} /><Field name="scheduled_at" label="Schedule" type="datetime-local" /><Field name="duration_minutes" label="Minutes" type="number" defaultValue="60" /><Select name="panel_user_id" label="Panel lead" items={userItems} /><Field name="location_or_link" label="Location / link" /></>;
  if (type === 'onboarding') return <><Select name="employee_id" label="Employee" items={employeeItems} /><Field name="start_date" label="Start date" type="date" /><Field name="target_completion_date" label="Target date" type="date" /><Field name="task_title" label="First task" /><Select name="assigned_to" label="Task owner" items={userItems} /><Field name="task_due_date" label="Task due" type="date" /></>;
  if (type === 'cycle') return <><Field name="name" label="Cycle name" /><Field name="starts_on" label="Starts" type="date" /><Field name="ends_on" label="Ends" type="date" /></>;
  if (type === 'goal') return <><Select name="performance_cycle_id" label="Cycle" items={data.performance_cycles || []} /><Select name="employee_id" label="Employee" items={employeeItems} /><Field name="title" label="Goal" /><Field name="weight" label="Weight %" type="number" /><Field name="target_value" label="Target value" type="number" /></>;
  if (type === 'review') return <><Select name="performance_cycle_id" label="Cycle" items={data.performance_cycles || []} /><Select name="employee_id" label="Employee" items={employeeItems} /><Select name="review_type" label="Review type" value="value" text="label" items={['self', 'manager', 'peer', 'hr'].map(item => ({ value: item, label: item }))} /><Field name="score" label="Score" type="number" /></>;
  if (type === 'course') return <><Field name="title" label="Course title" /><Field name="provider" label="Provider" /><Field name="duration_hours" label="Duration hours" type="number" /><Field name="cost" label="Cost" type="number" /></>;
  if (type === 'enroll') return <><Select name="training_course_id" label="Course" items={data.training_courses || []} text="title" /><Select name="employee_id" label="Employee" items={employeeItems} /></>;
  return <><Select name="employee_id" label="Employee" items={employeeItems} /><Select name="separation_type" label="Separation" value="value" text="label" items={['resignation', 'termination', 'retirement', 'redundancy', 'death', 'contract_end'].map(item => ({ value: item, label: item }))} /><Field name="notice_date" label="Notice date" type="date" /><Field name="last_working_date" label="Last working date" type="date" /><Field name="reason" label="Reason" /><Field name="clearance_area" label="Clearance area" defaultValue="IT and Assets" /><Select name="approver_id" label="Approver" items={userItems} /></>;
}

function recordTitle(row) {
  return row.title || row.candidate_name || row.employee_name || row.name || row.area || `#${row.id}`;
}

function recordContext(row) {
  return row.job_title || row.type || row.separation_type || row.description || row.provider || '-';
}

function recordDate(row) {
  return (row.scheduled_at || row.start_date || row.starts_on || row.last_working_date || row.created_at || '').slice(0, 10) || '-';
}
