import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/UI/ToastAlert';
import SharedStatCard from '../../components/UI/StatCard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyBangladeshiIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { reportService } from '../../services/reportService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartColors = ['#0f766e', '#f59e0b', '#4f46e5', '#e11d48', '#0891b2', '#84cc16', '#f97316', '#7c3aed'];
const money = value => `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
const percent = value => `${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 1 })}%`;

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        color: '#475569',
        font: { size: 11, weight: 'bold' },
      },
    },
  },
};

export default function Reports() {
  const [dashboardStats, setDashboardStats] = useState({});
  const [employeeStats, setEmployeeStats] = useState({});
  const [attendanceData, setAttendanceData] = useState({});
  const [leaveData, setLeaveData] = useState({});
  const [payrollData, setPayrollData] = useState({});
  const [hrmData, setHrmData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, employees, attendance, leaves, payroll, hrm] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getEmployeeStats(),
        reportService.getAttendanceReport(dateRange),
        reportService.getLeaveReport(dateRange),
        reportService.getPayrollReport({ year: new Date().getFullYear() }),
        reportService.getHrmOverview(dateRange),
      ]);

      setDashboardStats(dashboard.data || {});
      setEmployeeStats(employees.data || {});
      setAttendanceData(attendance.data || {});
      setLeaveData(leaves.data || {});
      setPayrollData(payroll.data || {});
      setHrmData(hrm.data || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports right now');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const departmentRows = useMemo(() => employeeStats.department_stats || [], [employeeStats.department_stats]);
  const attendanceRows = useMemo(() => attendanceData.employee_summary || [], [attendanceData.employee_summary]);
  const leaveDepartments = useMemo(() => leaveData.department_breakdown || [], [leaveData.department_breakdown]);
  const payrollDepartments = useMemo(() => payrollData.department_breakdown || [], [payrollData.department_breakdown]);

  const derived = useMemo(() => {
    const totalEmployees = Number(dashboardStats.total_employees || hrmData.headcount || 0);
    const activeEmployees = Number(dashboardStats.active_employees || hrmData.headcount || 0);
    const present = Number(attendanceData.status_breakdown?.present || 0);
    const totalAttendance = Number(attendanceData.total_records || 0);
    const approvedLeaves = Number(leaveData.status_breakdown?.approved || 0);
    const pendingLeaves = Number(dashboardStats.pending_leaves || leaveData.status_breakdown?.pending || 0);
    const attendanceRate = totalAttendance ? (present / totalAttendance) * 100 : 0;
    const activeRate = totalEmployees ? (activeEmployees / totalEmployees) * 100 : 0;

    return {
      totalEmployees,
      activeEmployees,
      activeRate,
      attendanceRate,
      present,
      totalAttendance,
      approvedLeaves,
      pendingLeaves,
      payrollTotal: Number(payrollData.total_payroll_amount || hrmData.payroll_total || 0),
      averageSalary: Number(payrollData.average_salary || 0),
      expenses: Number(hrmData.expense_total || 0),
      turnover: Number(hrmData.turnover_rate || 0),
    };
  }, [attendanceData, dashboardStats, hrmData, leaveData, payrollData]);

  const charts = useMemo(() => ({
    department: {
      labels: departmentRows.map(dept => dept.name || 'Unassigned'),
      datasets: [{
        label: 'Employees',
        data: departmentRows.map(dept => dept.employee_count || 0),
        backgroundColor: chartColors,
        borderRadius: 8,
        maxBarThickness: 36,
      }],
    },
    attendance: {
      labels: attendanceData.status_breakdown ? Object.keys(attendanceData.status_breakdown) : [],
      datasets: [{
        label: 'Attendance',
        data: attendanceData.status_breakdown ? Object.values(attendanceData.status_breakdown) : [],
        backgroundColor: ['#0f766e', '#e11d48', '#f59e0b', '#4f46e5', '#0891b2'],
        borderWidth: 0,
      }],
    },
    leaveTypes: {
      labels: leaveData.type_breakdown ? Object.keys(leaveData.type_breakdown) : [],
      datasets: [{
        label: 'Leaves',
        data: leaveData.type_breakdown ? Object.values(leaveData.type_breakdown) : [],
        backgroundColor: chartColors,
        borderWidth: 0,
      }],
    },
    payrollTrend: {
      labels: payrollData.monthly_trend?.map(item => item.month) || [],
      datasets: [{
        label: 'Net payroll',
        data: payrollData.monthly_trend?.map(item => item.total_amount) || [],
        borderColor: '#0f766e',
        backgroundColor: 'rgba(20,184,166,0.14)',
        pointBackgroundColor: '#0f766e',
        pointBorderWidth: 0,
        tension: 0.36,
        fill: true,
      }],
    },
    salaryDistribution: {
      labels: payrollData.salary_distribution ? Object.keys(payrollData.salary_distribution) : [],
      datasets: [{
        label: 'Employees',
        data: payrollData.salary_distribution ? Object.values(payrollData.salary_distribution) : [],
        backgroundColor: ['#ccfbf1', '#fde68a', '#c7d2fe', '#fecdd3', '#bae6fd'],
        borderColor: ['#0f766e', '#b45309', '#4f46e5', '#e11d48', '#0891b2'],
        borderWidth: 1,
      }],
    },
    dailyAttendance: {
      labels: attendanceData.daily_trend?.map(item => item.date) || [],
      datasets: [
        {
          label: 'Present',
          data: attendanceData.daily_trend?.map(item => item.present) || [],
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15,118,110,0.12)',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Late',
          data: attendanceData.daily_trend?.map(item => item.late) || [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'Absent',
          data: attendanceData.daily_trend?.map(item => item.absent) || [],
          borderColor: '#e11d48',
          backgroundColor: 'rgba(225,29,72,0.06)',
          tension: 0.35,
          fill: true,
        },
      ],
    },
  }), [attendanceData, departmentRows, leaveData, payrollData]);

  const insights = [
    {
      title: 'Attendance health',
      value: percent(derived.attendanceRate),
      text: `${derived.present} present records from ${derived.totalAttendance} attendance entries in selected period.`,
      icon: CheckCircleIcon,
      tone: 'teal',
    },
    {
      title: 'People stability',
      value: percent(derived.activeRate),
      text: `${derived.activeEmployees} active employees out of ${derived.totalEmployees} total headcount.`,
      icon: UserGroupIcon,
      tone: 'indigo',
    },
    {
      title: 'Leave pressure',
      value: derived.pendingLeaves,
      text: `${derived.approvedLeaves} approved leaves and ${derived.pendingLeaves} pending approvals need visibility.`,
      icon: ClockIcon,
      tone: 'amber',
    },
    {
      title: 'Turnover signal',
      value: percent(derived.turnover),
      text: `${hrmData.separations || 0} completed separations recorded in the selected period.`,
      icon: PresentationChartLineIcon,
      tone: 'rose',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-sm font-medium text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_55%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.26),0_8px_0_rgba(15,33,55,0.10)] sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black">Reports & Analytics</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateInput label="From" value={dateRange.start_date} onChange={value => setDateRange({ ...dateRange, start_date: value })} />
            <DateInput label="To" value={dateRange.end_date} onChange={value => setDateRange({ ...dateRange, end_date: value })} />
            <button title="Refresh" onClick={fetchAllReports} className="inline-flex h-11 items-center gap-2 bg-teal-400 px-4 text-sm font-black text-slate-950 shadow-[0_12px_22px_rgba(15,118,110,0.20)] hover:bg-teal-300">
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </section>

      {error && <Alert message={error} />}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Headcount" value={derived.totalEmployees} icon={UserGroupIcon} theme="teal" />
        <SummaryCard label="Net Payroll" value={money(derived.payrollTotal)} icon={CurrencyBangladeshiIcon} theme="amber" />
        <SummaryCard label="Attendance Rate" value={percent(derived.attendanceRate)} icon={CheckCircleIcon} theme="indigo" />
        <SummaryCard label="Pending Leaves" value={derived.pendingLeaves} icon={CalendarDaysIcon} theme="rose" />
      </div>

      <section className="grid gap-5 xl:grid-cols-4">
        {insights.map(item => <InsightCard key={item.title} item={item} />)}
      </section>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="grid gap-px bg-slate-200/70 md:grid-cols-2 xl:grid-cols-6">
          <MetricTile label="Today Attendance" value={dashboardStats.today_attendance || 0} />
          <MetricTile label="Documents Expiring" value={hrmData.documents_expiring || 0} />
          <MetricTile label="Pending Approvals" value={hrmData.pending_approvals || 0} />
          <MetricTile label="Expenses" value={money(derived.expenses)} />
          <MetricTile label="Learning Complete" value={percent(hrmData.training_completion_rate)} />
          <MetricTile label="Separations" value={hrmData.separations || 0} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel title="Department Distribution" subtitle="Employees by department" icon={ChartBarSquareIcon}>
          <Bar data={charts.department} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }} />
        </ChartPanel>

        <ChartPanel title="Attendance Status" subtitle="Present, absent, late and other status mix" icon={CheckCircleIcon}>
          <Doughnut data={charts.attendance} options={{ ...baseChartOptions, cutout: '62%' }} />
        </ChartPanel>

        <ChartPanel title="Daily Attendance Trend" subtitle="Selected period attendance movement" icon={PresentationChartLineIcon}>
          <Line data={charts.dailyAttendance} options={{ ...baseChartOptions, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }} />
        </ChartPanel>

        <ChartPanel title="Payroll Trend" subtitle={`Current year payroll movement, total ${money(derived.payrollTotal)}`} icon={BanknotesIcon}>
          <Line data={charts.payrollTrend} options={{ ...baseChartOptions, scales: { y: { beginAtZero: true, ticks: { callback: value => money(value) } }, x: { grid: { display: false } } } }} />
        </ChartPanel>

        <ChartPanel title="Leave Type Distribution" subtitle="Leave demand by category" icon={CalendarDaysIcon}>
          <Pie data={charts.leaveTypes} options={baseChartOptions} />
        </ChartPanel>

        <ChartPanel title="Salary Distribution" subtitle="Net salary bands from payroll records" icon={CurrencyBangladeshiIcon}>
          <Bar data={charts.salaryDistribution} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } } }} />
        </ChartPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DataPanel title="Department Headcount" subtitle="Workforce distribution">
          <SimpleRows
            rows={departmentRows.slice(0, 6)}
            empty="No department data available."
            render={row => (
              <>
                <span className="font-bold text-slate-900">{row.name || 'Unassigned'}</span>
                <span className="text-sm font-black text-teal-700">{row.employee_count || 0}</span>
              </>
            )}
          />
        </DataPanel>

        <DataPanel title="Top Attendance Records" subtitle="Employee attendance summary">
          <SimpleRows
            rows={[...attendanceRows].sort((a, b) => (b.total_present || 0) - (a.total_present || 0)).slice(0, 6)}
            empty="No attendance summary found."
            render={row => (
              <>
                <span>
                  <span className="block font-bold text-slate-900">{row.employee_name}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.total_late || 0} late, {row.total_absent || 0} absent</span>
                </span>
                <span className="text-sm font-black text-teal-700">{row.total_present || 0}</span>
              </>
            )}
          />
        </DataPanel>

        <DataPanel title="Leave by Department" subtitle="Approved and pending pressure">
          <SimpleRows
            rows={leaveDepartments.slice(0, 6)}
            empty="No leave department data available."
            render={row => (
              <>
                <span>
                  <span className="block font-bold text-slate-900">{row.department || 'Unassigned'}</span>
                  <span className="text-xs font-semibold text-slate-500">{row.approved || 0} approved, {row.pending || 0} pending</span>
                </span>
                <span className="text-sm font-black text-amber-700">{row.total_leaves || 0}</span>
              </>
            )}
          />
        </DataPanel>
      </div>

      <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Payroll Department Snapshot</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black uppercase text-teal-800">
            <DocumentChartBarIcon className="h-4 w-4" />
            {payrollDepartments.length} departments
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Employees</th>
                <th className="px-5 py-3">Total Salary</th>
                <th className="px-5 py-3">Average Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {payrollDepartments.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-sm font-semibold text-slate-500">No payroll department data available.</td></tr>
              ) : payrollDepartments.map(row => (
                <tr key={row.department || 'unassigned'} className="hover:bg-teal-50/35">
                  <td className="px-5 py-4 font-bold text-slate-900">{row.department || 'Unassigned'}</td>
                  <td className="px-5 py-4 text-slate-600">{row.total_employees || 0}</td>
                  <td className="px-5 py-4 font-black text-teal-700">{money(row.total_salary)}</td>
                  <td className="px-5 py-4 text-slate-700">{money(row.average_salary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="flex h-11 items-center gap-2 border border-white/20 bg-white/10 px-3 text-xs font-black uppercase text-cyan-50/90">
      {label}
      <input
        type="date"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-8 border border-white/20 bg-white/90 px-2 text-sm font-bold normal-case text-slate-800 outline-none focus:border-teal-300"
      />
    </label>
  );
}

function SummaryCard(props) {
  return <SharedStatCard {...props} />;
}

const insightThemes = {
  teal: {
    shell: 'border-teal-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdfa_54%,#ccfbf1_100%)] shadow-[0_20px_40px_rgba(15,118,110,0.16),0_8px_0_rgba(15,118,110,0.08)]',
    accent: 'from-teal-500 via-cyan-400 to-amber-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(15,118,110,0.35)]',
    value: 'text-teal-700',
    floor: 'bg-teal-700/10',
  },
  amber: {
    shell: 'border-amber-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#fffbeb_54%,#fde68a_100%)] shadow-[0_20px_40px_rgba(180,83,9,0.15),0_8px_0_rgba(180,83,9,0.08)]',
    accent: 'from-amber-400 via-orange-400 to-teal-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(180,83,9,0.28)]',
    value: 'text-amber-700',
    floor: 'bg-amber-700/10',
  },
  indigo: {
    shell: 'border-indigo-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_54%,#c7d2fe_100%)] shadow-[0_20px_40px_rgba(67,56,202,0.14),0_8px_0_rgba(67,56,202,0.08)]',
    accent: 'from-indigo-500 via-sky-400 to-amber-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(67,56,202,0.3)]',
    value: 'text-indigo-700',
    floor: 'bg-indigo-700/10',
  },
  rose: {
    shell: 'border-rose-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f2_54%,#fecdd3_100%)] shadow-[0_20px_40px_rgba(190,18,60,0.14),0_8px_0_rgba(190,18,60,0.08)]',
    accent: 'from-rose-500 via-pink-400 to-cyan-300',
    icon: 'text-slate-600 shadow-[0_14px_26px_rgba(190,18,60,0.28)]',
    value: 'text-rose-700',
    floor: 'bg-rose-700/10',
  },
};

function InsightCard({ item }) {
  const styles = insightThemes[item.tone] || insightThemes.teal;
  const Icon = item.icon;
  return (
    <article className={`group relative overflow-hidden rounded-[8px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${styles.shell}`}>
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${styles.accent}`} />
      <div className={`absolute bottom-0 right-0 h-20 w-28 -skew-x-12 ${styles.floor}`} />
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase text-slate-500">{item.title}</p>
            <p className={`mt-4 text-3xl font-black leading-none ${styles.value}`}>{item.value}</p>
          </div>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] transition-transform group-hover:-translate-y-1 group-hover:rotate-3 ${styles.icon}`}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </div>
    </article>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="bg-white/85 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function ChartPanel({ title, icon: Icon, children }) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-gray-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center justify-center">
          {React.createElement(Icon, { className: 'h-5 w-5' })}
        </div>
      </div>
      <div className="h-80 p-5">{children}</div>
    </section>
  );
}

function DataPanel({ title, children }) {
  return (
    <section className="overflow-hidden rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-slate-100 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      <div className="space-y-3 p-5">{children}</div>
    </section>
  );
}

function SimpleRows({ rows, empty, render }) {
  if (!rows.length) return <p className="py-8 text-center text-sm font-semibold text-slate-500">{empty}</p>;

  return rows.map((row, index) => (
    <div key={`${row.id || row.name || row.department || row.employee_name || index}`} className="flex items-center justify-between gap-4 border border-slate-100 bg-white/85 px-3 py-3 shadow-sm">
      {render(row)}
    </div>
  ));
}

function Alert({ type = 'error', message }) {
  return <ToastAlert type={type} message={message} />;
}
