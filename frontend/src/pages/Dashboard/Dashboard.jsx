import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import StatCard from '../../components/UI/StatCard';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Clock Component
const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getWeatherIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) {
      return <SunIcon className="h-8 w-8 text-yellow-500" />;
    } else {
      return <MoonIcon className="h-8 w-8 text-blue-400" />;
    }
  };

  return (
    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        {getWeatherIcon()}
        <div className="text-left lg:text-center">
          <div className="text-2xl font-bold text-white">
            {getGreeting()}
          </div>
          <div className="text-sm font-medium text-cyan-50/75">
            Have a productive day!
          </div>
        </div>
      </div>
      <div>
          <div className="text-xl font-bold text-white sm:text-3xl">
            {formatTime(currentTime)}
          </div>
          <div className="mt-1 text-sm font-medium text-cyan-50/80 sm:text-base">
            {formatDate(currentTime)}
          </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => (
  <div className="flex items-center justify-between border border-slate-100 bg-white/80 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/50 hover:shadow-md">
    <div className="flex items-center space-x-3">
      <div className={`flex-shrink-0 h-3 w-3 rounded-full ring-4 ring-slate-100 ${
        activity.status === 'approved' ? 'bg-green-500' :
        activity.status === 'rejected' ? 'bg-red-500' :
        activity.status === 'pending' ? 'bg-yellow-500' :
        'bg-blue-500'
      }`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{activity.type}</p>
        <p className="truncate text-sm text-slate-500">{activity.description}</p>
      </div>
    </div>
    <span className="whitespace-nowrap text-xs font-semibold text-slate-400">{activity.time}</span>
  </div>
);

const TaskItem = ({ task }) => (
  <div className="flex items-center justify-between border border-slate-100 bg-white/80 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md">
    <div className="flex-1 min-w-0">
      <p className="truncate text-sm font-bold text-slate-900">{task.title}</p>
      <div className="flex items-center space-x-3 mt-1">
        <span className={`border px-2 py-1 text-xs font-bold ${
          task.priority === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
          'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {task.priority}
        </span>
        <span className="text-xs font-medium text-slate-500">Due: {new Date(task.due_date).toLocaleDateString()}</span>
      </div>
    </div>
    <span className={`whitespace-nowrap border px-2 py-1 text-xs font-bold ${
      task.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
      'bg-gray-100 text-gray-800 border border-gray-200'
    }`}>
      {task.status?.replace('_', ' ') || 'pending'}
    </span>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [payrollTrend, setPayrollTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canViewAllData = [1, 2, 3].includes(user?.role_id);

  // Chart data based on real data
  const chartPalette = ['#14b8a6', '#f59e0b', '#6366f1', '#f43f5e', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'];

  const workforceChartData = {
    labels: ['Employees', 'Active Employees', 'Pending Leaves', 'Task Rate'],
    datasets: [
      {
        label: 'Workforce Snapshot',
        data: [
          stats?.total_employees || 0,
          stats?.active_employees || stats?.today_attendance || 0,
          stats?.pending_leaves || 0,
          stats?.task_completion_rate || 0,
        ],
        backgroundColor: ['#14b8a6', '#6366f1', '#f59e0b', '#f43f5e'],
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  };

  const departmentChartData = {
    labels: departmentStats.map(dept => dept.name) || [],
    datasets: [
      {
        label: 'Employees per Department',
        data: departmentStats.map(dept => dept.employee_count) || [],
        backgroundColor: chartPalette,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 46,
      },
    ],
  };

  const hasAttendanceBreakdown = ['present', 'absent', 'late', 'half_day'].some(key => Number(attendanceStats[key] || 0) > 0);
  const attendanceChartData = {
    labels: hasAttendanceBreakdown ? ['Present', 'Absent', 'Late', 'Half Day'] : ['Present', 'Not Marked'],
    datasets: [
      {
        label: 'Today\'s Attendance',
        data: hasAttendanceBreakdown ? [
          attendanceStats.present || 0,
          attendanceStats.absent || 0,
          attendanceStats.late || 0,
          attendanceStats.half_day || 0
        ] : [
          stats?.today_attendance || 0,
          Math.max((stats?.total_employees || 0) - (stats?.today_attendance || 0), 0),
        ],
        backgroundColor: hasAttendanceBreakdown ? ['#14b8a6', '#f43f5e', '#f59e0b', '#6366f1'] : ['#14b8a6', '#cbd5e1'],
        borderWidth: 4,
        borderColor: '#fff',
        hoverOffset: 8,
      },
    ],
  };

  const payrollTrendData = {
    labels: payrollTrend.map(item => item.month) || [],
    datasets: [
      {
        label: 'Payroll Amount',
        data: payrollTrend.map(item => item.total_amount) || [],
        backgroundColor: '#0f766e',
        hoverBackgroundColor: '#14b8a6',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 44,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: '#475569',
          font: { size: 12, weight: '600' },
        },
      },
      tooltip: {
        backgroundColor: '#0f2137',
        padding: 12,
        titleColor: '#ffffff',
        bodyColor: '#dbeafe',
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', precision: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        border: { display: false },
      },
      x: {
        ticks: { color: '#64748b' },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getDashboardStats();

        if (response.data.success) {
          const data = response.data.data;
          setStats(data);
          setRecentActivities(data.recent_activities || []);

          if (canViewAllData) {
            setDepartmentStats(data.department_stats || []);
            setAttendanceStats(data.attendance_stats || {});
            setPayrollTrend(data.payroll_trend || []);
          } else {
            setUpcomingTasks(data.upcoming_tasks || []);
          }
        } else {
          throw new Error(response.data.message || 'Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, canViewAllData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="professional-loader mx-auto" />
          <p className="mt-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-3 text-gray-500">No dashboard data available</p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative -m-4 min-h-full overflow-hidden bg-[linear-gradient(135deg,#e8f3f6_0%,#f6f8fb_42%,#eef2ff_100%)] p-4 sm:-m-6 sm:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,rgba(20,184,166,0.16),rgba(245,158,11,0.13),rgba(244,63,94,0.12))]" />
      <div className="pointer-events-none absolute inset-x-6 top-6 h-32 border border-white/60 bg-white/30 shadow-[0_24px_80px_rgba(15,33,55,0.08)]" />
      <div className="relative space-y-6">
      <div className="relative overflow-hidden border border-slate-900/10 bg-[linear-gradient(135deg,#0f2137_0%,#123352_54%,#0f766e_100%)] p-6 text-white shadow-[0_28px_60px_rgba(15,33,55,0.28),0_8px_0_rgba(15,33,55,0.10)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-amber-300 to-rose-400" />
        <div className="absolute bottom-0 right-0 h-28 w-80 -skew-x-12 bg-white/10" />
        <DigitalClock />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-teal-400 via-amber-300 to-rose-400" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {canViewAllData ? (
          <>
            <StatCard
              title="Total Employees"
              value={stats.total_employees || 0}
              icon={UsersIcon}
              theme="teal"
              onClick={() => window.location.href = '/employees'}
            />
            <StatCard
              title="Employees Active Today"
              value={stats.today_attendance || 0}
              icon={CalendarIcon}
              theme="indigo"
              onClick={() => window.location.href = '/attendances'}
            />
            <StatCard
              title="Pending Leaves"
              value={stats.pending_leaves || 0}
              icon={ExclamationTriangleIcon}
              theme="amber"
              onClick={() => window.location.href = '/leaves'}
            />
            <StatCard
              title="Task Completion"
              value={`${stats.task_completion_rate || 0}%`}
              icon={CheckCircleIcon}
              theme="rose"
              onClick={() => window.location.href = '/tasks'}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Pending Leaves"
              value={stats.my_pending_leaves || 0}
              subtitle="Awaiting approval"
              icon={ExclamationTriangleIcon}
              theme="amber"
              onClick={() => window.location.href = '/leaves'}
            />
            <StatCard
              title="Task Completion"
              value={`${stats.task_completion_rate || 0}%`}
              subtitle={`${stats.completed_tasks || 0}/${stats.total_tasks || 0} tasks`}
              icon={CheckCircleIcon}
              theme="teal"
              onClick={() => window.location.href = '/my-tasks'}
            />
            <StatCard
              title="Work Hours"
              value={`${stats.work_hours || 0}h`}
              subtitle="This month"
              icon={ClockIcon}
              theme="indigo"
              onClick={() => window.location.href = '/attendances'}
            />
            <StatCard
              title="Department Rank"
              value={`#${stats.department_ranking || 0}`}
              subtitle={`of ${stats.department_size || 0}`}
              icon={ChartBarIcon}
              theme="rose"
            />
          </>
        )}
      </div>

      {canViewAllData && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.10),0_6px_0_rgba(15,118,110,0.06)] backdrop-blur xl:col-span-3">
              <div className="p-4 bg-gray-100 border-b flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{departmentStats.length > 0 ? 'Department Distribution' : 'Workforce Snapshot'}</h3>
                </div>
                <div className="flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <Bar
                  data={departmentStats.length > 0 ? departmentChartData : workforceChartData}
                  options={barOptions}
                />
              </div>
          </section>

          <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.10),0_6px_0_rgba(245,158,11,0.07)] backdrop-blur xl:col-span-2">
              <div className="p-4 bg-gray-100 border-b flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Attendance Overview</h3>
                </div>
                <div className="flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <Pie
                  data={attendanceChartData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        position: 'bottom',
                        ...chartOptions.plugins.legend,
                      },
                    },
                  }}
                />
              </div>
          </section>

          {payrollTrend.length > 0 && (
            <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.10),0_6px_0_rgba(190,18,60,0.06)] backdrop-blur xl:col-span-5">
              <div className="p-4 bg-gray-100 border-b flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">Payroll Trend - {new Date().getFullYear()}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-rose-500 text-white shadow-[0_12px_24px_rgba(190,18,60,0.22)]">
                  <CurrencyDollarIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4">
                <Bar
                  data={payrollTrendData}
                  options={{
                    ...barOptions,
                    scales: {
                      ...barOptions.scales,
                      y: {
                        ...barOptions.scales.y,
                        beginAtZero: true,
                        ticks: {
                          color: '#64748b',
                          callback: function(value) {
                            return 'BDT ' + value.toLocaleString();
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </section>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
          <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">
              {canViewAllData ? 'Recent Activities' : 'My Recent Activities'}
            </h3>
            <DocumentChartBarIcon className="h-5 w-5 text-teal-600" />
          </div>
          <div className="space-y-2 p-4 overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </section>

        {canViewAllData ? (
          <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
            <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Performance Overview</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-4 p-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Total Departments</span>
                <span className="text-lg font-bold text-teal-700">{stats.total_departments || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Active Employees</span>
                <span className="text-lg font-bold text-indigo-700">{stats.active_employees || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">Task Completion Rate</span>
                <span className="text-lg font-bold text-amber-700">{stats.task_completion_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-gray-700">Monthly Payroll</span>
                <span className="text-lg font-bold text-rose-700">
                  BDT {(stats.total_payroll || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[8px] border border-white/70 bg-white/90 shadow-[0_18px_44px_rgba(15,23,42,0.09)] backdrop-blur">
            <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Upcoming Tasks</h3>
              <CheckCircleIcon className="h-5 w-5 text-teal-600" />
            </div>
            <div className="space-y-2 p-4 max-h-96 overflow-y-auto">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, index) => (
                  <TaskItem key={index} task={task} />
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming tasks</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
