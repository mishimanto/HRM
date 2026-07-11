<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Leave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BulkOperationController extends Controller
{
    public function bulkAttendance(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.employee_id' => 'required|exists:employees,id',
            'attendances.*.status' => 'required|in:present,absent,late,half_day,holiday',
            'attendances.*.check_in' => 'nullable|date_format:H:i',
            'attendances.*.check_out' => 'nullable|date_format:H:i|after:attendances.*.check_in',
        ]);

        DB::beginTransaction();

        try {
            $processed = 0;
            $errors = [];

            foreach ($request->attendances as $attendanceData) {
                try {
                    // Check if attendance already exists
                    $existing = Attendance::where('employee_id', $attendanceData['employee_id'])
                        ->where('date', $request->date)
                        ->first();

                    $attendanceDataToSave = [
                        'employee_id' => $attendanceData['employee_id'],
                        'date' => $request->date,
                        'status' => $attendanceData['status'],
                        'check_in' => $attendanceData['check_in'] ?? null,
                        'check_out' => $attendanceData['check_out'] ?? null,
                    ];

                    if ($existing) {
                        $existing->update($attendanceDataToSave);
                    } else {
                        $attendance = Attendance::create($attendanceDataToSave);
                    }

                    // Calculate total hours if both check_in and check_out exist
                    if ($attendanceData['check_out'] && $attendanceData['check_in']) {
                        $checkIn = \Carbon\Carbon::parse($attendanceData['check_in']);
                        $checkOut = \Carbon\Carbon::parse($attendanceData['check_out']);
                        $totalHours = $checkOut->diffInHours($checkIn);
                        
                        if ($existing) {
                            $existing->update(['total_hours' => $totalHours]);
                        } else {
                            $attendance->update(['total_hours' => $totalHours]);
                        }
                    }

                    $processed++;
                } catch (\Exception $e) {
                    $employee = Employee::find($attendanceData['employee_id']);
                    $employeeName = $employee && $employee->user ? $employee->user->name : 'Unknown Employee';
                    $errors[] = "Employee {$employeeName}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully processed {$processed} attendance records",
                'errors' => $errors,
                'processed' => $processed,
                'total' => count($request->attendances),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Bulk operation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function bulkLeaveStatus(Request $request)
    {
        $request->validate([
            'leave_ids' => 'required|array',
            'leave_ids.*' => 'exists:leaves,id',
            'status' => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $processed = 0;
            $errors = [];

            foreach ($request->leave_ids as $leaveId) {
                try {
                    $leave = Leave::findOrFail($leaveId);

                    if ($leave->status !== 'pending') {
                        $errors[] = "Leave ID {$leaveId} is already processed";
                        continue;
                    }

                    $leave->update([
                        'status' => $request->status,
                        'approved_by' => $request->user()->id,
                        'admin_notes' => $request->admin_notes,
                    ]);

                    // Send notification (you can implement this)
                    // $leave->employee->user->notify(new LeaveStatusNotification($leave));

                    $processed++;
                } catch (\Exception $e) {
                    $errors[] = "Leave ID {$leaveId}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully updated {$processed} leave applications",
                'errors' => $errors,
                'processed' => $processed,
                'total' => count($request->leave_ids),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Bulk operation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function bulkEmployeeStatus(Request $request)
    {
        $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
            'is_active' => 'required|boolean',
        ]);

        try {
            $processed = 0;

            foreach ($request->employee_ids as $employeeId) {
                $employee = Employee::findOrFail($employeeId);
                $employee->user->update([
                    'is_active' => $request->is_active,
                ]);
                $processed++;
            }

            return response()->json([
                'message' => "Successfully updated {$processed} employees",
                'processed' => $processed,
                'total' => count($request->employee_ids),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bulk operation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getEmployeesForBulkAttendance(Request $request)
    {
        try {
            $request->validate([
                'date' => 'required|date',
                'department_id' => 'nullable|exists:departments,id',
            ]);

            $employees = Employee::with(['user', 'department'])
                ->when($request->department_id, function($query, $departmentId) {
                    $query->where('department_id', $departmentId);
                })
                ->whereHas('user', function($query) {
                    $query->where('is_active', true);
                })
                ->get()
                ->map(function($employee) use ($request) {
                    $attendance = Attendance::where('employee_id', $employee->id)
                        ->where('date', $request->date)
                        ->first();

                    // Safe access with null checks
                    $userName = $employee->user ? $employee->user->name : 'Unknown Employee';
                    $employeeCode = $employee->user ? $employee->user->employee_id : 'N/A';
                    $departmentName = $employee->department ? $employee->department->name : 'N/A';

                    return [
                        'employee_id' => $employee->id,
                        'employee_name' => $userName,
                        'employee_code' => $employeeCode,
                        'department' => $departmentName,
                        'current_status' => $attendance ? $attendance->status : 'Not marked',
                        'check_in' => $attendance ? $attendance->check_in : null,
                        'check_out' => $attendance ? $attendance->check_out : null,
                    ];
                });

            return response()->json($employees);

        } catch (\Exception $e) {
            \Log::error('Bulk attendance error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employees for bulk attendance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}