<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $payrolls = Payroll::with('employee.user')
            ->when($request->employee_id, function($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->pay_period, function($query, $payPeriod) {
                $query->where('pay_period', $payPeriod);
            })
            ->when($request->status, function($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->month, function($query, $month) {
                $query->whereYear('pay_date', Carbon::parse($month)->year)
                      ->whereMonth('pay_date', Carbon::parse($month)->month);
            })
            ->orderBy('pay_date', 'desc')
            ->paginate(20);

        return response()->json($payrolls);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'pay_period' => 'required|in:monthly,bi-weekly,weekly',
            'pay_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'house_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'tax_deduction' => 'nullable|numeric|min:0',
            'other_deductions' => 'nullable|numeric|min:0',
        ]);

        // Calculate net salary
        $grossSalary = $request->basic_salary + 
                      ($request->house_allowance ?? 0) + 
                      ($request->transport_allowance ?? 0) + 
                      ($request->bonus ?? 0) + 
                      ($request->overtime_pay ?? 0);
        
        $totalDeductions = ($request->tax_deduction ?? 0) + ($request->other_deductions ?? 0);
        $netSalary = $grossSalary - $totalDeductions;

        $payroll = Payroll::create([
            'employee_id' => $request->employee_id,
            'pay_period' => $request->pay_period,
            'pay_date' => $request->pay_date,
            'basic_salary' => $request->basic_salary,
            'house_allowance' => $request->house_allowance ?? 0,
            'transport_allowance' => $request->transport_allowance ?? 0,
            'bonus' => $request->bonus ?? 0,
            'overtime_pay' => $request->overtime_pay ?? 0,
            'tax_deduction' => $request->tax_deduction ?? 0,
            'other_deductions' => $request->other_deductions ?? 0,
            'net_salary' => $netSalary,
            'status' => 'processed',
        ]);

        return response()->json([
            'payroll' => $payroll->load('employee.user'),
            'message' => 'Payroll created successfully'
        ], 201);
    }

    public function show(Payroll $payroll)
    {
        return response()->json([
            'payroll' => $payroll->load('employee.user')
        ]);
    }

    public function update(Request $request, Payroll $payroll)
    {
        $request->validate([
            'pay_period' => 'required|in:monthly,bi-weekly,weekly',
            'pay_date' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'house_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'tax_deduction' => 'nullable|numeric|min:0',
            'other_deductions' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,processed,paid',
        ]);

        // Recalculate net salary
        $grossSalary = $request->basic_salary + 
                      ($request->house_allowance ?? 0) + 
                      ($request->transport_allowance ?? 0) + 
                      ($request->bonus ?? 0) + 
                      ($request->overtime_pay ?? 0);
        
        $totalDeductions = ($request->tax_deduction ?? 0) + ($request->other_deductions ?? 0);
        $netSalary = $grossSalary - $totalDeductions;

        $payroll->update([
            'pay_period' => $request->pay_period,
            'pay_date' => $request->pay_date,
            'basic_salary' => $request->basic_salary,
            'house_allowance' => $request->house_allowance ?? 0,
            'transport_allowance' => $request->transport_allowance ?? 0,
            'bonus' => $request->bonus ?? 0,
            'overtime_pay' => $request->overtime_pay ?? 0,
            'tax_deduction' => $request->tax_deduction ?? 0,
            'other_deductions' => $request->other_deductions ?? 0,
            'net_salary' => $netSalary,
            'status' => $request->status,
        ]);

        return response()->json([
            'payroll' => $payroll->load('employee.user'),
            'message' => 'Payroll updated successfully'
        ]);
    }

    public function destroy(Payroll $payroll)
    {
        $payroll->delete();

        return response()->json([
            'message' => 'Payroll deleted successfully'
        ]);
    }

    public function employeePayrolls(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee record not found'
            ], 404);
        }

        $payrolls = Payroll::with('employee.user')
            ->where('employee_id', $employee->id)
            ->orderBy('pay_date', 'desc')
            ->paginate(12);

        return response()->json($payrolls);
    }

    public function payrollSummary(Request $request)
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $startDate = Carbon::parse($request->month)->startOfMonth();
        $endDate = Carbon::parse($request->month)->endOfMonth();

        $payrolls = Payroll::with('employee.user')
            ->whereBetween('pay_date', [$startDate, $endDate])
            ->get();

        $summary = [
            'total_payrolls' => $payrolls->count(),
            'total_amount' => $payrolls->sum('net_salary'),
            'average_salary' => $payrolls->avg('net_salary'),
            'status_breakdown' => $payrolls->groupBy('status')->map->count(),
            'department_breakdown' => $payrolls->groupBy('employee.department.name')->map(function($items) {
                return [
                    'count' => $items->count(),
                    'total_amount' => $items->sum('net_salary')
                ];
            })
        ];

        return response()->json($summary);
    }
}