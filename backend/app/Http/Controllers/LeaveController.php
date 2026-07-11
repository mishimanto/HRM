<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\ApprovalRequest;
use App\Notifications\LeaveStatusNotification;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $leaves = Leave::with(['employee.user', 'approvedBy'])
            ->when($request->employee_id, function($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->status, function($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->leave_type, function($query, $leaveType) {
                $query->where('leave_type', $leaveType);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($leaves);
    }

    public function store(Request $request, \App\Services\ApprovalRouter $approvalRouter, \App\Services\LeaveDayCalculator $dayCalculator)
    {
        $request->validate([
            'employee_id' => 'nullable|exists:employees,id',
            'leave_type_id' => 'nullable|exists:leave_types,id',
            'leave_type' => 'required_without:leave_type_id|string|max:50',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:1000',
            'day_portion' => 'sometimes|in:full,first_half,second_half',
        ]);

        $employeeId = $request->user()->hasPermission('leave.view')
            ? ($request->employee_id ?? $request->user()->employee?->id)
            : $request->user()->employee?->id;
        abort_unless($employeeId, 404, 'Employee record not found');

        $overlappingLeave = Leave::where('employee_id', $employeeId)
            ->where('status', '!=', 'rejected')
            ->where(function($query) use ($request) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date])
                      ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                      ->orWhere(function($q) use ($request) {
                          $q->where('start_date', '<=', $request->start_date)
                            ->where('end_date', '>=', $request->end_date);
                      });
            })
            ->first();

        if ($overlappingLeave) {
            return response()->json([
                'message' => 'You already have a leave application for this period'
            ], 422);
        }

        $startDate = Carbon::parse($request->start_date);
        $endDate = Carbon::parse($request->end_date);
        $employee = Employee::findOrFail($employeeId);
        $totalDays = $dayCalculator->calculate($employee, $request->start_date, $request->end_date, $request->day_portion ?? 'full');
        abort_if($totalDays <= 0, 422, 'Selected period contains no working days');

        $leave = Leave::create([
            'employee_id' => $employeeId,
            'leave_type_id' => $request->leave_type_id,
            'leave_type' => $request->leave_type ?? \App\Models\LeaveType::find($request->leave_type_id)?->code,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_days' => $totalDays,
            'requested_days' => $totalDays,
            'day_portion' => $request->day_portion ?? 'full',
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        ApprovalRequest::create([
            'approvable_type' => Leave::class, 'approvable_id' => $leave->id,
            'requested_by' => $request->user()->id, 'approver_id' => $approvalRouter->firstApprover('leave', $leave->employee),
            'status' => 'pending', 'step' => 1,
        ]);

        return response()->json([
            'leave' => $leave->load('employee.user'),
            'message' => 'Leave application submitted successfully'
        ], 201);
    }

    public function show(Leave $leave)
    {
        return response()->json([
            'leave' => $leave->load(['employee.user', 'approvedBy'])
        ]);
    }

    public function updateStatus(Request $request, Leave $leave)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        if ($leave->status !== 'pending') {
            return response()->json([
                'message' => 'Leave application has already been processed'
            ], 422);
        }

        $user = $request->user();

        \Illuminate\Support\Facades\DB::transaction(function() use ($request, $leave, $user) {
            if ($request->status === 'approved') app(\App\Services\LeaveBalanceService::class)->consume($leave, $user->id);
            $leave->update(['status'=>$request->status,'approved_by'=>$user?->id,'admin_notes'=>$request->admin_notes]);
        });
        $leave->approvals()->where('status', 'pending')->update([
            'status' => $request->status, 'approver_id' => $user->id,
            'comments' => $request->admin_notes, 'acted_at' => now(),
        ]);

        // Notify user safely
        if ($leave->employee && $leave->employee->user) {
            try {
                $leave->employee->user->notify(new \App\Notifications\LeaveStatusNotification($leave));
            } catch (\Exception $e) {
                \Log::error('LeaveStatusNotification failed: ' . $e->getMessage());
            }
        }

        // Optional: real-time broadcast if event exists
        if (class_exists(\App\Events\LeaveStatusUpdated::class)) {
            broadcast(new \App\Events\LeaveStatusUpdated($leave));
        }

        return response()->json([
            'leave' => $leave->load(['employee.user', 'approvedBy']),
            'message' => 'Leave application ' . $request->status . ' successfully'
        ]);
    }


    public function destroy(Request $request, Leave $leave)
    {
        $canManage = $request->user()->hasPermission('leave.approve');
        abort_unless($canManage || $request->user()->employee?->id === $leave->employee_id, 403, 'You cannot delete this leave request');
        if ($leave->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave applications can be deleted'
            ], 422);
        }

        $leave->delete();

        return response()->json([
            'message' => 'Leave application deleted successfully'
        ]);
    }

    public function employeeLeaves(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json([
                'message' => 'Employee record not found'
            ], 404);
        }

        $leaves = Leave::with(['employee.user', 'approvedBy'])
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($leaves);
    }
}
