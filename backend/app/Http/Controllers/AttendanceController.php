<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $attendances = Attendance::with('employee.user')
            ->when($request->employee_id, function($query, $employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->when($request->date, function($query, $date) {
                $query->where('date', $date);
            })
            ->when($request->month, function($query, $month) {
                $query->whereMonth('date', Carbon::parse($month)->month)
                      ->whereYear('date', Carbon::parse($month)->year);
            })
            ->orderBy('date', 'desc')
            ->paginate(50);

        return response()->json($attendances);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'check_in' => 'required|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,absent,late,half_day,holiday',
        ]);

        // Check if attendance already exists for this employee and date
        $existingAttendance = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'message' => 'Attendance already recorded for this date'
            ], 422);
        }

        $attendance = Attendance::create($request->all());

        // Calculate total hours if check_out is provided
        if ($request->check_out) {
            $attendance->calculateTotalHours();
        }

        return response()->json([
            'attendance' => $attendance->load('employee.user'),
            'message' => 'Attendance recorded successfully'
        ], 201);
    }

    public function checkIn(Request $request)
    {
        try {
            Log::info('CheckIn Request:', $request->all());

            $request->validate(['employee_id' => 'nullable|exists:employees,id']);
            $employeeId = $request->user()->hasPermission('attendance.manage')
                ? ($request->employee_id ?? $request->user()->employee?->id)
                : $request->user()->employee?->id;
            abort_unless($employeeId, 404, 'Employee record not found');

            $today = now()->toDateString();
            
            Log::info('Today date: ' . $today);

            $existing = Attendance::where('employee_id', $employeeId)->where('date', $today)->first();
            if ($existing?->check_in) {
                return response()->json(['message' => 'Already checked in today', 'attendance' => $existing], 422);
            }
            $shiftAssignment = \App\Models\ShiftAssignment::with('shift')->where('employee_id', $employeeId)
                ->whereDate('effective_from', '<=', $today)->where(fn($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $today))->latest('effective_from')->first();
            $lateMinutes = $shiftAssignment?->shift
                ? max(0, Carbon::parse($shiftAssignment->shift->starts_at)->diffInMinutes(now(), false) - $shiftAssignment->shift->grace_minutes)
                : 0;
            $attendance = Attendance::firstOrCreate([
                'employee_id' => $employeeId,
                'date' => $today,
            ], [
                'check_in' => now()->format('H:i:s'),
                'status' => $lateMinutes > 0 ? 'late' : 'present',
                'shift_id' => $shiftAssignment?->shift_id,
                'late_minutes' => $lateMinutes,
            ]);

            // Load relationships and append formatted times
            $attendance->load('employee.user');
            $attendance->append(['check_in_formatted', 'check_out_formatted']);

            Log::info('Attendance created/updated:', $attendance->toArray());

            return response()->json([
                'attendance' => $attendance,
                'message' => 'Checked in successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('CheckIn Error: ' . $e->getMessage());
            Log::error('Stack Trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function checkOut(Request $request)
    {
        try {
            Log::info('=== CHECKOUT PROCESS STARTED ===');
            Log::info('CheckOut Request:', $request->all());

            $request->validate(['employee_id' => 'nullable|exists:employees,id']);
            $employeeId = $request->user()->hasPermission('attendance.manage')
                ? ($request->employee_id ?? $request->user()->employee?->id)
                : $request->user()->employee?->id;
            abort_unless($employeeId, 404, 'Employee record not found');

            $today = now()->toDateString();
            
            Log::info('Looking for attendance for date: ' . $today);

            $attendance = Attendance::where('employee_id', $employeeId)
                ->where('date', $today)
                ->first();

            if (!$attendance) {
                Log::warning('No attendance found for employee: ' . $request->employee_id);
                return response()->json([
                    'message' => 'No check-in found for today'
                ], 422);
            }

            Log::info('Found attendance:', [
                'id' => $attendance->id,
                'check_in' => $attendance->check_in,
                'check_out' => $attendance->check_out,
                'total_hours' => $attendance->total_hours
            ]);

            // ✅ FIXED: Single update with all data
            $checkOutTime = now()->format('H:i:s');
            $totalHours = 0;
            $totalMinutes = 0;

            // Calculate total hours if check_in exists
            if ($attendance->check_in) {
                try {
                    // Combine date with time for accurate calculation
                    $checkInDateTime = $attendance->date . ' ' . $attendance->check_in;
                    $checkOutDateTime = $today . ' ' . $checkOutTime;
                    
                    Log::info('DateTime strings:', [
                        'check_in' => $checkInDateTime,
                        'check_out' => $checkOutDateTime
                    ]);

                    $checkIn = Carbon::parse($checkInDateTime);
                    $checkOut = Carbon::parse($checkOutDateTime);
                    
                    $totalMinutes = $checkOut->diffInMinutes($checkIn);
                    $totalHours = $totalMinutes / 60;
                    
                    Log::info('Calculation result:', [
                        'total_minutes' => $totalMinutes,
                        'total_hours' => $totalHours
                    ]);

                } catch (\Exception $e) {
                    Log::error('Carbon parse error: ' . $e->getMessage());
                    // Fallback calculation using simple time difference
                    $inTime = strtotime($attendance->check_in);
                    $outTime = strtotime($checkOutTime);
                    $diff = $outTime - $inTime;
                    $totalHours = abs($diff / 3600); // Convert seconds to hours
                    Log::info('Fallback calculation result: ' . $totalHours);
                }
            }

            // ✅ SINGLE UPDATE CALL with all data
            $attendance->update([
                'check_out' => $checkOutTime,
                'total_hours' => round($totalHours, 2),
                'worked_minutes' => abs((int) $totalMinutes),
                'overtime_minutes' => max(0, abs((int) $totalMinutes) - ($attendance->shift?->overtime_after_minutes ?? 480)),
            ]);

            Log::info('Attendance after update:', [
                'id' => $attendance->id,
                'check_in' => $attendance->check_in,
                'check_out' => $attendance->check_out,
                'total_hours' => $attendance->total_hours
            ]);

            // Load relationships
            $attendance->load('employee.user');
            $attendance->append(['check_in_formatted', 'check_out_formatted']);

            Log::info('=== CHECKOUT PROCESS COMPLETED SUCCESSFULLY ===');

            return response()->json([
                'attendance' => $attendance,
                'message' => 'Checked out successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('=== CHECKOUT PROCESS FAILED ===');
            Log::error('CheckOut Error: ' . $e->getMessage());
            Log::error('Stack Trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function myAttendance(Request $request)
    {
        abort_unless($request->user()->employee, 404, 'Employee record not found');
        return Attendance::with('shift')->where('employee_id', $request->user()->employee->id)
            ->when($request->month, fn($q,$month) => $q->whereYear('date', Carbon::parse($month)->year)->whereMonth('date', Carbon::parse($month)->month))
            ->orderByDesc('date')->paginate(31);
    }

    public function show(Attendance $attendance)
    {
        return response()->json([
            'attendance' => $attendance->load('employee.user')
        ]);
    }

    public function update(Request $request, Attendance $attendance)
    {
        $request->validate([
            'check_in' => 'required|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i|after:check_in',
            'status' => 'required|in:present,absent,late,half_day,holiday',
        ]);

        // ✅ FIXED: Single update with total hours calculation
        $totalHours = 0;
        
        if ($request->check_in && $request->check_out) {
            try {
                // Combine date with time for accurate calculation
                $checkInDateTime = $attendance->date . ' ' . $request->check_in;
                $checkOutDateTime = $attendance->date . ' ' . $request->check_out;
                
                $checkIn = Carbon::parse($checkInDateTime);
                $checkOut = Carbon::parse($checkOutDateTime);
                $totalHours = $checkOut->diffInMinutes($checkIn) / 60;
                
            } catch (\Exception $e) {
                Log::error('Update calculation error: ' . $e->getMessage());
                // Fallback calculation
                $inTime = strtotime($request->check_in);
                $outTime = strtotime($request->check_out);
                $diff = $outTime - $inTime;
                $totalHours = abs($diff / 3600);
            }
        }

        $attendance->update([
            'check_in' => $request->check_in,
            'check_out' => $request->check_out,
            'status' => $request->status,
            'total_hours' => round($totalHours, 2)
        ]);

        return response()->json([
            'attendance' => $attendance->load('employee.user'),
            'message' => 'Attendance updated successfully'
        ]);
    }

    public function monthlyReport(Request $request)
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $startDate = Carbon::parse($request->month)->startOfMonth();
        $endDate = Carbon::parse($request->month)->endOfMonth();

        $query = Attendance::with('employee.user')
            ->whereBetween('date', [$startDate, $endDate]);

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        $attendances = $query->get();

        $report = $attendances->groupBy('employee_id')->map(function($employeeAttendances) {
            $employee = $employeeAttendances->first()->employee;
            
            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->user->name,
                'total_present' => $employeeAttendances->where('status', 'present')->count(),
                'total_absent' => $employeeAttendances->where('status', 'absent')->count(),
                'total_late' => $employeeAttendances->where('status', 'late')->count(),
                'total_half_day' => $employeeAttendances->where('status', 'half_day')->count(),
                'total_working_hours' => $employeeAttendances->sum('total_hours'),
            ];
        })->values();

        return response()->json($report);
    }
}
