import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { talentService } from '../../services/workspaceService';
import { departmentService } from '../../services/departmentService';
import { employeeService } from '../../services/employeeService';

const tabs = [
  ['requisitions', 'Requisitions'], ['applications', 'Applications'], ['interviews', 'Interviews'],
  ['onboarding', 'Onboarding'], ['onboarding_tasks', 'Onboarding tasks'], ['performance_cycles', 'Cycles'],
  ['performance_goals', 'Goals'], ['performance_reviews', 'Reviews'], ['training_courses', 'Courses'],
  ['training_enrollments', 'Enrollments'], ['offboarding', 'Offboarding'], ['offboarding_clearances', 'Clearances'],
];

const statusTone = (status = '') => status.includes('reject') || status.includes('cancel') ? 'bg-red-50 text-red-700' : status.includes('complete') || status === 'open' || status === 'hired' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700';

export default function TalentWorkspace() {
  const [active, setActive] = useState('requisitions');
  const [data, setData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [overview, departmentResponse, employeeResponse] = await Promise.all([talentService.overview(), departmentService.getAll(), employeeService.getAll()]);
      setData(overview.data); setDepartments(departmentResponse.data?.data || departmentResponse.data || []); setEmployees(employeeResponse.data?.data || []);
    } catch (e) { setError(e.response?.data?.message || 'Unable to load talent workspace'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => data[active] || [], [data, active]);
  const submit = async (event) => {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (form === 'requisition') await talentService.createRequisition({ ...values, vacancies: Number(values.vacancies), description: values.description || values.title });
      if (form === 'candidate') await talentService.createCandidate(values);
      if (form === 'application') await talentService.apply({job_requisition_id:Number(values.job_requisition_id),candidate_id:Number(values.candidate_id)});
      if (form === 'interview') await talentService.scheduleInterview({job_application_id:Number(values.job_application_id),type:values.type,scheduled_at:values.scheduled_at,duration_minutes:Number(values.duration_minutes),location_or_link:values.location_or_link,panel_user_ids:[Number(values.panel_user_id)]});
      if (form === 'onboarding') await talentService.startOnboarding({employee_id:Number(values.employee_id),start_date:values.start_date,target_completion_date:values.target_completion_date||null,tasks:[{title:values.task_title,assigned_to:Number(values.assigned_to)||null,due_date:values.task_due_date||null}]});
      if (form === 'cycle') await talentService.createCycle({name:values.name,starts_on:values.starts_on,ends_on:values.ends_on,status:'active'});
      if (form === 'goal') await talentService.createGoal({performance_cycle_id:Number(values.performance_cycle_id),employee_id:Number(values.employee_id),title:values.title,weight:Number(values.weight),target_value:values.target_value?Number(values.target_value):null});
      if (form === 'review') await talentService.createReview({performance_cycle_id:Number(values.performance_cycle_id),employee_id:Number(values.employee_id),review_type:values.review_type,score:values.score?Number(values.score):null,status:'submitted'});
      if (form === 'course') await talentService.createCourse({...values,duration_hours:Number(values.duration_hours),cost:Number(values.cost||0)});
      if (form === 'enroll') await talentService.enroll({training_course_id:Number(values.training_course_id),employee_id:Number(values.employee_id)});
      if (form === 'offboarding') await talentService.startOffboarding({employee_id:Number(values.employee_id),separation_type:values.separation_type,notice_date:values.notice_date,last_working_date:values.last_working_date,reason:values.reason,clearance_areas:[{area:values.clearance_area,approver_id:Number(values.approver_id)||null}]});
      setForm(null); await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not save record'); }
  };

  const advance = async (row, value) => {
    if (active === 'requisitions') await talentService.updateRequisitionStatus(row.id, value);
    if (active === 'applications') await talentService.updateApplicationStage(row.id, value);
    await load();
  };
  const closeAction = async (row) => {
    try {
      if (active === 'interviews') await talentService.interviewResult(row.id, {status:'completed',score:100,feedback:'Completed'});
      if (active === 'onboarding_tasks') await talentService.completeOnboardingTask(row.id);
      if (active === 'training_enrollments') await talentService.completeTraining(row.id, {score:100});
      if (active === 'offboarding_clearances') await talentService.updateClearance(row.id, {status:'cleared'});
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not complete action'); }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold text-gray-950">Talent & Lifecycle</h1><p className="text-sm text-gray-500">Recruitment, development and employee transitions</p></div>
      <div className="flex gap-2">
        <button title="Refresh" onClick={load} className="h-10 w-10 border border-gray-300 bg-white flex items-center justify-center"><ArrowPathIcon className="h-5 w-5" /></button>
        {active === 'requisitions' && <button onClick={() => setForm('requisition')} className="h-10 px-4 bg-gray-900 text-white text-sm font-medium flex items-center gap-2"><PlusIcon className="h-4 w-4" />Requisition</button>}
        {active === 'applications' && <><button onClick={() => setForm('candidate')} className="h-10 px-3 border bg-white text-sm">Candidate</button><button onClick={() => setForm('application')} className="h-10 px-4 bg-gray-900 text-white text-sm flex items-center gap-2"><PlusIcon className="h-4 w-4" />Application</button></>}
        {active === 'interviews' && <button onClick={() => setForm('interview')} className="h-10 px-4 bg-gray-900 text-white text-sm flex items-center gap-2"><PlusIcon className="h-4 w-4" />Interview</button>}
        {active === 'onboarding' && <button onClick={() => setForm('onboarding')} className="h-10 px-4 bg-gray-900 text-white text-sm flex items-center gap-2"><PlusIcon className="h-4 w-4" />Onboarding</button>}
        {active === 'performance_cycles' && <><button onClick={() => setForm('goal')} className="h-10 px-3 border bg-white text-sm">Goal</button><button onClick={() => setForm('review')} className="h-10 px-3 border bg-white text-sm">Review</button><button onClick={() => setForm('cycle')} className="h-10 px-4 bg-gray-900 text-white text-sm">Cycle</button></>}
        {active === 'training_courses' && <><button onClick={() => setForm('enroll')} className="h-10 px-3 border bg-white text-sm">Enroll</button><button onClick={() => setForm('course')} className="h-10 px-4 bg-gray-900 text-white text-sm">Course</button></>}
        {active === 'offboarding' && <button onClick={() => setForm('offboarding')} className="h-10 px-4 bg-gray-900 text-white text-sm">Start offboarding</button>}
      </div>
    </div>
    <div className="flex overflow-x-auto border border-gray-200 bg-white">
      {tabs.map(([key,label]) => <button key={key} onClick={() => setActive(key)} className={`min-h-12 px-3 text-sm border-b-2 ${active===key?'border-emerald-600 text-emerald-700 bg-emerald-50':'border-transparent text-gray-600 hover:bg-gray-50'}`}>{label}<span className="ml-2 text-xs text-gray-400">{data[key]?.length || 0}</span></button>)}
    </div>
    {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="border border-gray-200 bg-white overflow-x-auto min-h-72">
      {loading ? <div className="p-10 text-center text-gray-500">Loading records...</div> : rows.length === 0 ? <div className="p-10 text-center text-gray-500">No records in this workflow.</div> : <table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Record</th><th className="px-4 py-3">Context</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.map(row => <tr key={row.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-900">{row.title || row.candidate_name || row.employee_name || row.name || row.area || `#${row.id}`}</td><td className="px-4 py-3 text-gray-600">{row.job_title || row.type || row.separation_type || row.description || '-'}</td><td className="px-4 py-3 text-gray-500">{(row.scheduled_at || row.start_date || row.starts_on || row.last_working_date || row.created_at || '').slice(0,10)}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium ${statusTone(row.status || row.stage)}`}>{row.status || row.stage || 'Active'}</span></td><td className="px-4 py-3 text-right">{active==='requisitions'&&row.status==='draft'&&<button onClick={()=>advance(row,'open')} className="text-emerald-700 font-medium">Open</button>}{active==='applications'&&!['hired','rejected'].includes(row.stage)&&<button onClick={()=>advance(row,row.stage==='applied'?'screening':'shortlisted')} className="text-emerald-700 font-medium">Advance</button>}{active==='interviews'&&row.status==='scheduled'&&<button onClick={()=>closeAction(row)} className="text-emerald-700">Complete</button>}{active==='onboarding_tasks'&&row.status!=='completed'&&<button onClick={()=>closeAction(row)} className="text-emerald-700">Complete</button>}{active==='training_enrollments'&&row.status!=='completed'&&<button onClick={()=>closeAction(row)} className="text-emerald-700">Complete</button>}{active==='offboarding_clearances'&&row.status==='pending'&&<button onClick={()=>closeAction(row)} className="text-emerald-700">Clear</button>}</td></tr>)}</tbody></table>}
    </div>
    {form && <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white border shadow-xl"><div className="flex justify-between items-center px-5 py-4 border-b"><h2 className="font-semibold">New {form}</h2><button type="button" title="Close" onClick={()=>setForm(null)}><XMarkIcon className="h-5 w-5" /></button></div><div className="p-5 grid grid-cols-2 gap-4"><TalentForm type={form} data={data} departments={departments} employees={employees}/></div><div className="px-5 py-4 border-t flex justify-end"><button className="bg-gray-900 text-white px-4 py-2 text-sm">Save</button></div></form></div>}
  </div>;
}

function Field({label,name,type='text',defaultValue}) { return <label className="text-sm text-gray-700">{label}<input required name={name} type={type} defaultValue={defaultValue} className="mt-1 w-full border border-gray-300 px-3 py-2 outline-none focus:border-emerald-600"/></label>; }
function Select({label,name,items,value='id',text='name'}){return <label className="text-sm">{label}<select required name={name} className="mt-1 w-full border p-2"><option value="">Select</option>{items.map(x=><option key={x[value]} value={x[value]}>{x[text]||x.title||x.candidate_name}</option>)}</select></label>}
function TalentForm({type,data,departments,employees}){if(type==='requisition')return <><Field name="title" label="Job title"/><Select name="department_id" label="Department" items={departments}/><Field name="vacancies" label="Vacancies" type="number" defaultValue="1"/><Select name="employment_type" label="Employment type" value="value" text="label" items={['full-time','part-time','contract','intern'].map(x=>({value:x,label:x}))}/><div className="col-span-2"><Field name="description" label="Description"/></div></>;if(type==='candidate')return <><Field name="name" label="Full name"/><Field name="email" label="Email" type="email"/><Field name="phone" label="Phone"/><Field name="source" label="Source"/></>;if(type==='application')return <><Select name="job_requisition_id" label="Requisition" items={data.requisitions||[]} text="title"/><Select name="candidate_id" label="Candidate" items={data.candidates||[]}/></>;if(type==='interview')return <><Select name="job_application_id" label="Application" items={data.applications||[]} text="candidate_name"/><Select name="type" label="Type" value="value" text="label" items={['phone','video','onsite','technical','hr','final'].map(x=>({value:x,label:x}))}/><Field name="scheduled_at" label="Schedule" type="datetime-local"/><Field name="duration_minutes" label="Minutes" type="number" defaultValue="60"/><Select name="panel_user_id" label="Panel lead" items={employees.map(e=>({id:e.user?.id,name:e.user?.name}))}/><Field name="location_or_link" label="Location / link"/></>;if(type==='onboarding')return <><Select name="employee_id" label="Employee" items={employees.map(e=>({id:e.id,name:e.user?.name}))}/><Field name="start_date" label="Start date" type="date"/><Field name="target_completion_date" label="Target date" type="date"/><Field name="task_title" label="First task"/><Select name="assigned_to" label="Task owner" items={employees.map(e=>({id:e.user?.id,name:e.user?.name}))}/><Field name="task_due_date" label="Task due" type="date"/></>;if(type==='cycle')return <><Field name="name" label="Cycle name"/><Field name="starts_on" label="Starts" type="date"/><Field name="ends_on" label="Ends" type="date"/></>;if(type==='goal')return <><Select name="performance_cycle_id" label="Cycle" items={data.performance_cycles||[]}/><Select name="employee_id" label="Employee" items={employees.map(e=>({id:e.id,name:e.user?.name}))}/><Field name="title" label="Goal"/><Field name="weight" label="Weight %" type="number"/><Field name="target_value" label="Target value" type="number"/></>;if(type==='review')return <><Select name="performance_cycle_id" label="Cycle" items={data.performance_cycles||[]}/><Select name="employee_id" label="Employee" items={employees.map(e=>({id:e.id,name:e.user?.name}))}/><Select name="review_type" label="Review type" value="value" text="label" items={['self','manager','peer','hr'].map(x=>({value:x,label:x}))}/><Field name="score" label="Score" type="number"/></>;if(type==='course')return <><Field name="title" label="Course title"/><Field name="provider" label="Provider"/><Field name="duration_hours" label="Duration hours" type="number"/><Field name="cost" label="Cost" type="number"/></>;if(type==='enroll')return <><Select name="training_course_id" label="Course" items={data.training_courses||[]} text="title"/><Select name="employee_id" label="Employee" items={employees.map(e=>({id:e.id,name:e.user?.name}))}/></>;return <><Select name="employee_id" label="Employee" items={employees.map(e=>({id:e.id,name:e.user?.name}))}/><Select name="separation_type" label="Separation" value="value" text="label" items={['resignation','termination','retirement','redundancy','death','contract_end'].map(x=>({value:x,label:x}))}/><Field name="notice_date" label="Notice date" type="date"/><Field name="last_working_date" label="Last working date" type="date"/><Field name="reason" label="Reason"/><Field name="clearance_area" label="Clearance area" defaultValue="IT and Assets"/><Select name="approver_id" label="Approver" items={employees.map(e=>({id:e.user?.id,name:e.user?.name}))}/></>}
