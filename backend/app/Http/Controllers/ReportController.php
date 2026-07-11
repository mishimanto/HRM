<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Payroll;
use App\Models\Department;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class ReportController extends Controller
{
    public function dashboardStats()
    {
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::whereHas('user', function($query) {
            $query->where('is_active', true);
        })->count();
        
        $todayAttendance = Attendance::whereDate('date', today())->count();
        $pendingLeaves = Leave::where('status', 'pending')->count();

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'today_attendance' => $todayAttendance,
            'pending_leaves' => $pendingLeaves,
        ]);
    }

    public function employeeStats()
    {
        $departmentStats = DB::table('employees')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->select('departments.name', DB::raw('COUNT(employees.id) as employee_count'))
            ->groupBy('departments.id', 'departments.name')
            ->get();

        $employmentTypeStats = DB::table('employees')
            ->select('employment_type', DB::raw('COUNT(*) as count'))
            ->groupBy('employment_type')
            ->get();

        return response()->json([
            'department_stats' => $departmentStats,
            'employment_type_stats' => $employmentTypeStats,
        ]);
    }

    public function attendanceReport(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        $query = Attendance::with('employee.user')
            ->whereBetween('date', [$startDate, $endDate]);

        if ($request->department_id) {
            $query->whereHas('employee', function($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        $attendances = $query->get();

        // Daily attendance trend
        $dailyTrend = $attendances->groupBy('date')->map(function($dayAttendances, $date) {
            return [
                'date' => $date,
                'present' => $dayAttendances->where('status', 'present')->count(),
                'absent' => $dayAttendances->where('status', 'absent')->count(),
                'late' => $dayAttendances->where('status', 'late')->count(),
            ];
        })->values();

        // Status breakdown
        $statusBreakdown = $attendances->groupBy('status')->map->count();

        // Employee-wise summary
        $employeeSummary = $attendances->groupBy('employee_id')->map(function($employeeAttendances) {
            $employee = $employeeAttendances->first()->employee;
            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->user->name,
                'total_present' => $employeeAttendances->where('status', 'present')->count(),
                'total_absent' => $employeeAttendances->where('status', 'absent')->count(),
                'total_late' => $employeeAttendances->where('status', 'late')->count(),
                'total_half_day' => $employeeAttendances->where('status', 'half_day')->count(),
            ];
        })->values();

        return response()->json([
            'daily_trend' => $dailyTrend,
            'status_breakdown' => $statusBreakdown,
            'employee_summary' => $employeeSummary,
            'total_records' => $attendances->count(),
        ]);
    }

    public function leaveReport(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);

        $leaves = Leave::with('employee.user')
            ->whereBetween('start_date', [$startDate, $endDate])
            ->get();

        // Leave type breakdown
        $typeBreakdown = $leaves->groupBy('leave_type')->map->count();

        // Status breakdown
        $statusBreakdown = $leaves->groupBy('status')->map->count();

        // Monthly trend
        $monthlyTrend = $leaves->groupBy(function($leave) {
            return Carbon::parse($leave->start_date)->format('Y-m');
        })->map(function($monthLeaves, $month) {
            return [
                'month' => $month,
                'total_leaves' => $monthLeaves->count(),
                'approved' => $monthLeaves->where('status', 'approved')->count(),
                'pending' => $monthLeaves->where('status', 'pending')->count(),
                'rejected' => $monthLeaves->where('status', 'rejected')->count(),
            ];
        })->values();

        // Department-wise breakdown
        $departmentBreakdown = $leaves->groupBy('employee.department.name')->map(function($deptLeaves, $deptName) {
            return [
                'department' => $deptName,
                'total_leaves' => $deptLeaves->count(),
                'approved' => $deptLeaves->where('status', 'approved')->count(),
                'pending' => $deptLeaves->where('status', 'pending')->count(),
            ];
        })->values();

        return response()->json([
            'type_breakdown' => $typeBreakdown,
            'status_breakdown' => $statusBreakdown,
            'monthly_trend' => $monthlyTrend,
            'department_breakdown' => $departmentBreakdown,
            'total_leaves' => $leaves->count(),
        ]);
    }

    public function payrollReport(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
            'month' => 'nullable|integer|between:1,12',
        ]);

        $query = Payroll::with('employee.user.department')
            ->whereYear('pay_date', $request->year);

        if ($request->month) {
            $query->whereMonth('pay_date', $request->month);
        }

        $payrolls = $query->get();

        // Monthly payroll trend
        $monthlyTrend = $payrolls->groupBy(function($payroll) {
            return Carbon::parse($payroll->pay_date)->format('Y-m');
        })->map(function($monthPayrolls, $month) {
            return [
                'month' => $month,
                'total_payrolls' => $monthPayrolls->count(),
                'total_amount' => $monthPayrolls->sum('net_salary'),
                'average_salary' => $monthPayrolls->avg('net_salary'),
            ];
        })->values();

        // Department-wise payroll
        $departmentPayroll = $payrolls->groupBy('employee.user.department.name')->map(function($deptPayrolls, $deptName) {
            return [
                'department' => $deptName,
                'total_employees' => $deptPayrolls->count(),
                'total_salary' => $deptPayrolls->sum('net_salary'),
                'average_salary' => $deptPayrolls->avg('net_salary'),
            ];
        })->values();

        // Salary distribution
        $salaryRanges = [
            '0-5000' => 0,
            '5001-10000' => 0,
            '10001-20000' => 0,
            '20001-50000' => 0,
            '50001+' => 0,
        ];

        foreach ($payrolls as $payroll) {
            $salary = $payroll->net_salary;
            if ($salary <= 5000) {
                $salaryRanges['0-5000']++;
            } elseif ($salary <= 10000) {
                $salaryRanges['5001-10000']++;
            } elseif ($salary <= 20000) {
                $salaryRanges['10001-20000']++;
            } elseif ($salary <= 50000) {
                $salaryRanges['20001-50000']++;
            } else {
                $salaryRanges['50001+']++;
            }
        }

        return response()->json([
            'monthly_trend' => $monthlyTrend,
            'department_breakdown' => $departmentPayroll,
            'salary_distribution' => $salaryRanges,
            'total_payroll_amount' => $payrolls->sum('net_salary'),
            'average_salary' => $payrolls->avg('net_salary'),
        ]);
    }
}