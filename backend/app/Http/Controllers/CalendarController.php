<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CalendarController extends Controller
{
    public function events(Request $request)
    {
        $start = $request->get('start', Carbon::now()->startOfMonth()->toDateString());
        $end = $request->get('end', Carbon::now()->endOfMonth()->toDateString());

        $events = [];

        // Leaves - shob employee er leaves (admin/hr der jonno)
        $leaves = Leave::with('employee.user')
            ->whereBetween('start_date', [$start, $end])
            ->orWhereBetween('end_date', [$start, $end])
            ->get();

        foreach ($leaves as $leave) {
            $events[] = [
                'id' => 'leave_' . $leave->id,
                'title' => $leave->employee->user->name . ' - ' . ucfirst($leave->leave_type) . ' Leave',
                'start' => $leave->start_date,
                'end' => Carbon::parse($leave->end_date)->addDay()->toDateString(),
                'color' => $this->getLeaveColor($leave->status),
                'type' => 'leave',
                'extendedProps' => [
                    'employee_name' => $leave->employee->user->name,
                    'leave_type' => $leave->leave_type,
                    'status' => $leave->status,
                    'reason' => $leave->reason,
                ],
            ];
        }

        // Holidays
        $holidays = [
            ['title' => 'New Year', 'date' => Carbon::now()->year . '-01-01'],
            ['title' => 'Christmas', 'date' => Carbon::now()->year . '-12-25'],
        ];

        foreach ($holidays as $holiday) {
            $events[] = [
                'id' => 'holiday_' . $holiday['date'],
                'title' => $holiday['title'],
                'start' => $holiday['date'],
                'allDay' => true,
                'color' => '#EF4444',
                'type' => 'holiday',
            ];
        }

        // Birthdays
        $birthdays = Employee::with('user')
            ->whereHas('user', function($query) use ($start, $end) {
                $query->whereNotNull('date_of_birth')
                      ->whereRaw('MONTH(date_of_birth) BETWEEN ? AND ?', [
                          Carbon::parse($start)->month,
                          Carbon::parse($end)->month
                      ]);
            })
            ->get();

        foreach ($birthdays as $employee) {
            $birthdayDate = Carbon::parse($employee->user->date_of_birth)
                ->year(Carbon::now()->year)
                ->toDateString();

            if ($birthdayDate >= $start && $birthdayDate <= $end) {
                $events[] = [
                    'id' => 'birthday_' . $employee->id,
                    'title' => $employee->user->name . ' - Birthday',
                    'start' => $birthdayDate,
                    'allDay' => true,
                    'color' => '#8B5CF6',
                    'type' => 'birthday',
                ];
            }
        }

        return response()->json($events);
    }

    public function myEvents(Request $request)
    {
        // Current logged-in user er employee record khujchi
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json([]);
        }

        $start = $request->get('start', Carbon::now()->startOfMonth()->toDateString());
        $end = $request->get('end', Carbon::now()->endOfMonth()->toDateString());

        $events = [];

        // DEBUG: Check current employee info
        // \Log::info('MyEvents - User ID: ' . $request->user()->id . ', Employee ID: ' . $employee->id);

        // Sudhu current employee er leaves
        $leaves = Leave::where('employee_id', $employee->id)
            ->where(function($query) use ($start, $end) {
                $query->whereBetween('start_date', [$start, $end])
                      ->orWhereBetween('end_date', [$start, $end]);
            })
            ->get();

        \Log::info('MyEvents - Leaves found: ' . $leaves->count());

        foreach ($leaves as $leave) {
            $events[] = [
                'id' => 'leave_' . $leave->id,
                'title' => ucfirst($leave->leave_type) . ' Leave - ' . ucfirst($leave->status),
                'start' => $leave->start_date,
                'end' => Carbon::parse($leave->end_date)->addDay()->toDateString(),
                'color' => $this->getLeaveColor($leave->status),
                'type' => 'leave',
                'extendedProps' => [
                    'leave_type' => $leave->leave_type,
                    'status' => $leave->status,
                    'reason' => $leave->reason,
                ],
            ];
        }

        // Current employee er attendance
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$start, $end])
            ->get();

        foreach ($attendances as $attendance) {
            if ($attendance->status === 'absent') {
                $events[] = [
                    'id' => 'attendance_' . $attendance->id,
                    'title' => 'Absent',
                    'start' => $attendance->date,
                    'allDay' => true,
                    'color' => '#EF4444',
                    'type' => 'attendance',
                ];
            }
        }

        // Current employee er birthday (jodi thake)
        if ($employee->user->date_of_birth) {
            $birthdayDate = Carbon::parse($employee->user->date_of_birth)
                ->year(Carbon::now()->year)
                ->toDateString();

            if ($birthdayDate >= $start && $birthdayDate <= $end) {
                $events[] = [
                    'id' => 'birthday_' . $employee->id,
                    'title' => 'My Birthday',
                    'start' => $birthdayDate,
                    'allDay' => true,
                    'color' => '#8B5CF6',
                    'type' => 'birthday',
                ];
            }
        }

        \Log::info('MyEvents - Total events: ' . count($events));
        
        return response()->json($events);
    }

    private function getLeaveColor($status)
    {
        switch ($status) {
            case 'approved': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'rejected': return '#EF4444';
            default: return '#6B7280';
        }
    }
}