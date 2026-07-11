<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveAccrualService
{
    public function accrueMonth(Carbon $month): array
    {
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $processed = 0;
        $employees = DB::table('employees as e')->join('users as u', 'u.id', '=', 'e.user_id')
            ->where('u.is_active', true)->select('e.*')->get();
        $types = DB::table('leave_types')->where('is_active', true)->get();

        DB::transaction(function () use ($employees, $types, $start, $end, $month, &$processed) {
            foreach ($employees as $employee) {
                foreach ($types as $type) {
                    if (Carbon::parse($employee->joining_date)->diffInDays($end, false) < $type->minimum_service_days) continue;
                    [$amount, $source] = $this->amountFor($employee->id, $type, $start, $end, $month);
                    if ($amount <= 0) continue;
                    $reference = $month->format('Y-m');
                    $key = ['employee_id'=>$employee->id, 'leave_type_id'=>$type->id, 'source'=>$source, 'reference'=>$reference];
                    if (DB::table('leave_transactions')->where($key)->exists()) continue;
                    $balanceKey = ['employee_id'=>$employee->id, 'leave_type_id'=>$type->id, 'year'=>$month->year];
                    DB::table('leave_balances')->insertOrIgnore($balanceKey + ['accrued'=>0, 'created_at'=>now(), 'updated_at'=>now()]);
                    $balance = DB::table('leave_balances')->where($balanceKey)->lockForUpdate()->first();
                    $available = (float)$balance->opening_balance + (float)$balance->accrued + (float)$balance->adjusted - (float)$balance->used - (float)$balance->encashed;
                    if ($type->max_balance !== null) $amount = min($amount, max(0, (float)$type->max_balance - $available));
                    if ($amount <= 0) continue;
                    DB::table('leave_balances')->where($balanceKey)->increment('accrued', $amount, ['updated_at'=>now()]);
                    DB::table('leave_transactions')->insert($key + ['year'=>$month->year, 'type'=>'accrual', 'amount'=>$amount, 'created_at'=>now(), 'updated_at'=>now()]);
                    $processed++;
                }
            }
        });

        return ['processed'=>$processed, 'month'=>$month->format('Y-m')];
    }

    private function amountFor(int $employeeId, object $type, Carbon $start, Carbon $end, Carbon $month): array
    {
        if ($type->worked_days_divisor) {
            $worked = DB::table('attendances')->where('employee_id', $employeeId)->whereBetween('date', [$start, $end])
                ->whereIn('status', ['present','late','half_day'])->sum(DB::raw("CASE WHEN status='half_day' THEN 0.5 ELSE 1 END"));
            return [round($worked / (float)$type->worked_days_divisor, 2), 'worked_days_accrual'];
        }
        if ($type->accrual_frequency === 'monthly') return [(float)$type->accrual_amount, 'monthly_accrual'];
        if ($type->accrual_frequency === 'yearly' && $month->month === 1) return [(float)$type->annual_entitlement, 'annual_entitlement'];
        return [0.0, 'none'];
    }
}
