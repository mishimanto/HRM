<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use Illuminate\Http\Request;

class WorkforcePolicyController extends Controller
{
    public function holidays(Request $request)
    {
        return Holiday::query()
            ->when($request->year, fn ($q, $year) => $q->whereYear('date', $year))
            ->when($request->branch_id, fn ($q, $id) => $q->where(fn ($x) => $x->whereNull('branch_id')->orWhere('branch_id', $id)))
            ->orderBy('date')->get();
    }

    public function storeHoliday(Request $request)
    {
        return response()->json(Holiday::create($request->validate([
            'company_id' => 'nullable|exists:companies,id', 'branch_id' => 'nullable|exists:branches,id',
            'name' => 'required|string|max:255', 'date' => 'required|date',
            'type' => 'required|in:government,festival,company,optional',
            'is_paid' => 'sometimes|boolean', 'is_recurring' => 'sometimes|boolean',
        ])), 201);
    }

    public function updateHoliday(Request $request, Holiday $holiday)
    {
        $holiday->update($request->validate([
            'name' => 'sometimes|required|string|max:255', 'date' => 'sometimes|required|date',
            'type' => 'sometimes|required|in:government,festival,company,optional',
            'is_paid' => 'sometimes|boolean', 'is_recurring' => 'sometimes|boolean',
        ]));
        return $holiday;
    }

    public function destroyHoliday(Holiday $holiday) { $holiday->delete(); return response()->noContent(); }

    public function shifts() { return Shift::where('is_active', true)->orderBy('name')->get(); }

    public function storeShift(Request $request)
    {
        return response()->json(Shift::create($this->shiftData($request)), 201);
    }

    public function updateShift(Request $request, Shift $shift) { $shift->update($this->shiftData($request, true)); return $shift; }

    public function assignShift(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id', 'shift_id' => 'required|exists:shifts,id',
            'effective_from' => 'required|date', 'effective_to' => 'nullable|date|after_or_equal:effective_from',
        ]);
        $data['assigned_by'] = $request->user()->id;
        return response()->json(ShiftAssignment::create($data)->load(['shift', 'employee.user']), 201);
    }

    public function leaveTypes() { return LeaveType::where('is_active', true)->orderBy('name')->get(); }

    public function storeLeaveType(Request $request)
    {
        return response()->json(LeaveType::create($this->leaveTypeData($request)), 201);
    }

    public function updateLeaveType(Request $request, LeaveType $leaveType)
    {
        $leaveType->update($this->leaveTypeData($request, true));
        return $leaveType;
    }

    public function balances(Request $request)
    {
        $employeeId = $request->user()->hasPermission('leave.view')
            ? $request->validate(['employee_id' => 'required|exists:employees,id'])['employee_id']
            : $request->user()->employee?->id;

        abort_unless($employeeId, 404, 'Employee record not found');
        return LeaveBalance::with('leaveType')->where('employee_id', $employeeId)
            ->where('year', $request->integer('year', now()->year))->get();
    }

    private function shiftData(Request $request, bool $partial = false): array
    {
        $sometimes = $partial ? 'sometimes|' : '';
        return $request->validate([
            'company_id' => 'nullable|exists:companies,id', 'name' => $sometimes.'required|string|max:255',
            'code' => $sometimes.'required|string|max:50|unique:shifts,code,'.($request->route('shift')?->id ?? 'NULL'),
            'starts_at' => $sometimes.'required|date_format:H:i', 'ends_at' => $sometimes.'required|date_format:H:i',
            'break_minutes' => 'sometimes|integer|min:0|max:360', 'grace_minutes' => 'sometimes|integer|min:0|max:120',
            'standard_minutes' => 'sometimes|integer|min:1|max:1440', 'overtime_after_minutes' => 'sometimes|integer|min:1|max:1440',
            'weekly_off_days' => 'nullable|array', 'weekly_off_days.*' => 'integer|between:0,6',
            'is_night_shift' => 'sometimes|boolean', 'is_active' => 'sometimes|boolean',
        ]);
    }

    private function leaveTypeData(Request $request, bool $partial = false): array
    {
        $sometimes = $partial ? 'sometimes|' : '';
        return $request->validate([
            'company_id' => 'nullable|exists:companies,id', 'name' => $sometimes.'required|string|max:255',
            'code' => $sometimes.'required|string|max:50', 'annual_entitlement' => 'sometimes|numeric|min:0|max:365',
            'accrual_frequency' => 'sometimes|in:none,monthly,quarterly,yearly', 'accrual_amount' => 'sometimes|numeric|min:0',
            'worked_days_divisor' => 'nullable|numeric|min:1',
            'max_carry_forward' => 'sometimes|numeric|min:0', 'max_balance' => 'nullable|numeric|min:0',
            'minimum_service_days' => 'sometimes|integer|min:0', 'is_paid' => 'sometimes|boolean',
            'requires_document' => 'sometimes|boolean', 'is_encashable' => 'sometimes|boolean',
            'gender_specific' => 'sometimes|boolean', 'eligible_gender' => 'nullable|in:male,female,other', 'is_active' => 'sometimes|boolean',
        ]);
    }
}
