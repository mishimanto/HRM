<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function dashboardStats()
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Simple role check
            $isAdmin = in_array($user->role_id, [1, 2, 3]); // Admin, HR, Manager
            
            if ($isAdmin) {
                $stats = $this->getAdminDashboardStats($user);
            } else {
                $stats = $this->getEmployeeDashboardStats($user);
            }

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            \Log::error('Dashboard Error: ' . $e->getMessage());
            \Log::error('Stack Trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getAdminDashboardStats($user)
    {
        $today = Carbon::today()->toDateString();
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $firstDayOfMonth = Carbon::now()->firstOfMonth()->toDateString();
        
        // Total employees from database
        $totalEmployees = DB::table('employees')->count();
        
        // Active employees
        $activeEmployees = DB::table('employees')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->where('users.is_active', 1)
            ->count();
            
        // Today's attendance
        $todayAttendance = DB::table('attendances')
            ->where('date', $today)
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->count();
            
        // Pending leaves
        $pendingLeaves = DB::table('leaves')
            ->where('status', 'pending')
            ->count();
        
        // Total departments
        $totalDepartments = DB::table('departments')
            ->where('is_active', 1)
            ->count();

        // Total payroll amount for current month
        $totalPayroll = DB::table('payrolls')
            ->where('status', 'paid')
            ->where('pay_date', '>=', $firstDayOfMonth)
            ->sum('net_salary');

        // Attendance statistics for today
        $attendanceStats = DB::table('attendances')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('date', $today)
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        // Department-wise employee count
        $departmentStats = DB::table('departments')
            ->leftJoin('employees', 'departments.id', '=', 'employees.department_id')
            ->leftJoin('users', 'employees.user_id', '=', 'users.id')
            ->select(
                'departments.name',
                DB::raw('COUNT(employees.id) as employee_count')
            )
            ->where('departments.is_active', 1)
            ->where('users.is_active', 1)
            ->groupBy('departments.id', 'departments.name')
            ->get();

        // Monthly payroll trend for current year
        $payrollTrend = DB::table('payrolls')
            ->select(
                DB::raw('MONTH(pay_date) as month'),
                DB::raw('SUM(net_salary) as total_amount')
            )
            ->whereYear('pay_date', $currentYear)
            ->where('status', 'paid')
            ->groupBy(DB::raw('MONTH(pay_date)'))
            ->orderBy('month')
            ->get()
            ->map(function($item) {
                return [
                    'month' => Carbon::create()->month($item->month)->format('M'),
                    'total_amount' => $item->total_amount
                ];
            });

        // Recent leaves (last 7 days)
        $recentLeaves = DB::table('leaves')
            ->join('employees', 'leaves.employee_id', '=', 'employees.id')
            ->join('users', 'employees.user_id', '=', 'users.id')
            ->select(
                'leaves.*',
                'users.name as employee_name'
            )
            ->where('leaves.created_at', '>=', Carbon::now()->subDays(7))
            ->orderBy('leaves.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($leave) {
                return [
                    'type' => 'Leave Application',
                    'description' => $leave->employee_name . ' applied for ' . $leave->leave_type . ' leave',
                    'time' => Carbon::parse($leave->created_at)->diffForHumans(),
                    'status' => $leave->status
                ];
            });

        // Recent tasks (last 7 days)
        $recentTasks = DB::table('tasks')
            ->join('employees as assigned_to', 'tasks.assigned_to', '=', 'assigned_to.id')
            ->join('users as assigned_to_user', 'assigned_to.user_id', '=', 'assigned_to_user.id')
            ->join('users as assigned_by_user', 'tasks.assigned_by', '=', 'assigned_by_user.id')
            ->select(
                'tasks.*',
                'assigned_to_user.name as assigned_to_name',
                'assigned_by_user.name as assigned_by_name'
            )
            ->where('tasks.created_at', '>=', Carbon::now()->subDays(7))
            ->orderBy('tasks.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($task) {
                return [
                    'type' => 'Task Assigned',
                    'description' => $task->title . ' assigned to ' . $task->assigned_to_name,
                    'time' => Carbon::parse($task->created_at)->diffForHumans(),
                    'status' => $task->status
                ];
            });

        // This month attendance trend
        $monthlyAttendanceTrend = DB::table('attendances')
            ->select(
                DB::raw('DAY(date) as day'),
                DB::raw('COUNT(*) as present_count')
            )
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->groupBy(DB::raw('DAY(date)'))
            ->orderBy('day')
            ->get();

        // Employee performance metrics
        $completedTasks = DB::table('tasks')
            ->where('status', 'completed')
            ->where('completed_at', '>=', $firstDayOfMonth)
            ->count();

        $totalTasks = DB::table('tasks')
            ->where('created_at', '>=', $firstDayOfMonth)
            ->count();

        $taskCompletionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0;

        // Combine recent activities
        $recentActivities = $recentLeaves->merge($recentTasks)
            ->sortByDesc(function($activity) {
                return Carbon::parse($activity['time']);
            })
            ->values()
            ->take(5);

        return [
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'today_attendance' => $todayAttendance,
            'pending_leaves' => $pendingLeaves,
            'total_departments' => $totalDepartments,
            'total_payroll' => $totalPayroll,
            'attendance_stats' => $attendanceStats,
            'department_stats' => $departmentStats,
            'payroll_trend' => $payrollTrend,
            'monthly_attendance_trend' => $monthlyAttendanceTrend,
            'task_completion_rate' => $taskCompletionRate,
            'completed_tasks' => $completedTasks,
            'total_tasks' => $totalTasks,
            'recent_activities' => $recentActivities,
            'role' => $this->getRoleName($user->role_id)
        ];
    }

    private function getEmployeeDashboardStats($user)
    {
        $today = Carbon::today()->toDateString();
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;
        $firstDayOfMonth = Carbon::now()->firstOfMonth()->toDateString();
        
        // Get employee
        $employee = DB::table('employees')
            ->where('user_id', $user->id)
            ->first();
            
        if (!$employee) {
            return [
                'my_pending_leaves' => 0,
                'my_approved_leaves' => 0,
                'my_today_attendance' => 'Not Marked',
                'my_monthly_attendance' => '0%',
                'recent_activities' => [],
                'upcoming_tasks' => [],
                'role' => $this->getRoleName($user->role_id)
            ];
        }

        $employeeId = $employee->id;

        // Employee's leaves
        $myPendingLeaves = DB::table('leaves')
            ->where('employee_id', $employeeId)
            ->where('status', 'pending')
            ->count();
            
        $myApprovedLeaves = DB::table('leaves')
            ->where('employee_id', $employeeId)
            ->where('status', 'approved')
            ->count();

        // Today's attendance
        $todayAttendance = DB::table('attendances')
            ->where('employee_id', $employeeId)
            ->where('date', $today)
            ->first();
            
        $todayStatus = $todayAttendance ? ucfirst($todayAttendance->status) : 'Not Marked';

        // Monthly attendance percentage
        $totalWorkingDays = $this->getWorkingDays($currentMonth, $currentYear);
        $monthPresentDays = DB::table('attendances')
            ->where('employee_id', $employeeId)
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->count();
            
        $monthlyPercentage = $totalWorkingDays > 0 
            ? round(($monthPresentDays / $totalWorkingDays) * 100, 2) . '%'
            : '0%';

        // Employee's tasks statistics
        $completedTasks = DB::table('tasks')
            ->where('assigned_to', $employeeId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $firstDayOfMonth)
            ->count();

        $totalAssignedTasks = DB::table('tasks')
            ->where('assigned_to', $employeeId)
            ->where('created_at', '>=', $firstDayOfMonth)
            ->count();

        $taskCompletionRate = $totalAssignedTasks > 0 ? round(($completedTasks / $totalAssignedTasks) * 100, 2) : 0;

        // Work hours this month (approximate based on attendance)
        $workHours = DB::table('attendances')
            ->where('employee_id', $employeeId)
            ->whereYear('date', $currentYear)
            ->whereMonth('date', $currentMonth)
            ->whereIn('status', ['present', 'late', 'half_day'])
            ->count() * 8; // Assuming 8 hours per day

        // Recent activities
        $recentLeaves = DB::table('leaves')
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function($leave) {
                return [
                    'type' => 'Leave Application',
                    'description' => 'Your ' . $leave->leave_type . ' leave is ' . $leave->status,
                    'time' => Carbon::parse($leave->updated_at)->diffForHumans(),
                    'status' => $leave->status
                ];
            });

        // Recent attendance
        $recentAttendance = DB::table('attendances')
            ->where('employee_id', $employeeId)
            ->orderBy('date', 'desc')
            ->limit(2)
            ->get()
            ->map(function($attendance) {
                return [
                    'type' => 'Attendance',
                    'description' => 'You were ' . $attendance->status . ' on ' . $attendance->date,
                    'time' => Carbon::parse($attendance->created_at)->diffForHumans(),
                    'status' => $attendance->status
                ];
            });

        // Upcoming tasks
        $upcomingTasks = DB::table('tasks')
            ->where('assigned_to', $employeeId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->where('due_date', '>=', $today)
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        // Employee's payroll summary
        $myPayroll = DB::table('payrolls')
            ->where('employee_id', $employeeId)
            ->where('status', 'paid')
            ->orderBy('pay_date', 'desc')
            ->first();

        // Department ranking (based on task completion)
        $departmentRanking = DB::table('employees')
            ->select(
                'employees.id',
                DB::raw('(SELECT COUNT(*) FROM tasks WHERE tasks.assigned_to = employees.id AND tasks.status = "completed" AND tasks.completed_at >= "' . $firstDayOfMonth . '") as completed_tasks')
            )
            ->where('employees.department_id', $employee->department_id)
            ->orderBy('completed_tasks', 'desc')
            ->get();

        $myRank = $departmentRanking->search(function($item) use ($employeeId) {
            return $item->id == $employeeId;
        }) + 1;

        // Combine recent activities
        $recentActivities = $recentLeaves->merge($recentAttendance)
            ->sortByDesc(function($activity) {
                return Carbon::parse($activity['time']);
            })
            ->values()
            ->take(5);

        return [
            'my_pending_leaves' => $myPendingLeaves,
            'my_approved_leaves' => $myApprovedLeaves,
            'my_today_attendance' => $todayStatus,
            'my_monthly_attendance' => $monthlyPercentage,
            'my_salary' => $myPayroll ? $myPayroll->net_salary : $employee->salary,
            'completed_tasks' => $completedTasks,
            'total_tasks' => $totalAssignedTasks,
            'task_completion_rate' => $taskCompletionRate,
            'work_hours' => $workHours,
            'department_ranking' => $myRank,
            'department_size' => $departmentRanking->count(),
            'recent_activities' => $recentActivities,
            'upcoming_tasks' => $upcomingTasks,
            'role' => $this->getRoleName($user->role_id)
        ];
    }

    private function getWorkingDays($month, $year)
    {
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $weekends = 0;
        
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = Carbon::createFromDate($year, $month, $day);
            if ($date->isWeekend()) {
                $weekends++;
            }
        }
        
        return $daysInMonth - $weekends;
    }

    private function getRoleName($roleId)
    {
        $roles = [
            1 => 'Administrator',
            2 => 'HR Manager', 
            3 => 'Department Manager',
            4 => 'Employee'
        ];
        
        return $roles[$roleId] ?? 'Employee';
    }
}
