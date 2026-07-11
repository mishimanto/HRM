<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LoanInstallment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class BangladeshPayrollCalculator
{
    public function calculate(Employee $employee, Carbon $periodStart, Carbon $periodEnd, string $assessmentYear): array
    {
        $assignment = DB::table('employee_salary_structures')->where('employee_id', $employee->id)
            ->whereDate('effective_from', '<=', $periodEnd)
            ->where(fn ($q) => $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $periodStart))
            ->orderByDesc('effective_from')->first();
        if (!$assignment) throw new RuntimeException("No active salary structure for employee {$employee->id}");

        $components = DB::table('salary_structure_components as ssc')
            ->join('salary_components as sc', 'sc.id', '=', 'ssc.salary_component_id')
            ->where('ssc.salary_structure_id', $assignment->salary_structure_id)->where('sc.is_active', true)
            ->select('sc.*', 'ssc.value')->get();
        $overrides = json_decode($assignment->component_overrides ?? '{}', true) ?: [];
        $gross = (float) $assignment->gross_salary;
        $basic = 0.0; $earnings = []; $deductions = []; $employer = [];
        foreach ($components as $component) {
            $configured = (float) ($overrides[$component->code] ?? $component->value ?? $component->default_value);
            $base = $component->percentage_of === 'gross' ? $gross : ($basic ?: $gross);
            $amount = round($component->calculation_type === 'percentage' ? $base * $configured / 100 : $configured, 2);
            if ($component->is_basic) $basic = $amount;
            if ($component->type === 'earning') $earnings[$component->code] = $amount;
            elseif ($component->type === 'deduction') $deductions[$component->code] = $amount;
            else $employer[$component->code] = $amount;
        }

        $attendanceSummary = $this->attendanceSummary($employee->id, $periodStart, $periodEnd);
        $settings = json_decode(DB::table('companies')->where('id', $employee->company_id)->value('settings') ?? '{}', true) ?: [];
        $standardMinutes = (float) ($settings['standard_work_minutes'] ?? 480);
        $workingDays = (float) ($settings['monthly_working_days'] ?? 26);
        $overtimeMultiplier = (float) ($settings['overtime_multiplier'] ?? 2);
        $overtimeMinutes = (float) $attendanceSummary['overtime_minutes'] + (float) $attendanceSummary['holiday_worked_minutes'];
        $overtimePay = round(($basic / max(1, $workingDays * $standardMinutes)) * $overtimeMinutes * $overtimeMultiplier, 2);
        if ($overtimePay > 0) $earnings['OVERTIME'] = $overtimePay;
        $bonuses = DB::table('employee_bonuses')->where('employee_id', $employee->id)->where('status', 'approved')->whereBetween('payment_date', [$periodStart, $periodEnd])->get();
        foreach ($bonuses as $bonus) $earnings['BONUS_'.$bonus->id] = (float) $bonus->amount;
        $grossEarnings = array_sum($earnings);
        $taxableMonthly = $components->where('type', 'earning')->where('is_taxable', true)->sum(fn ($c) => $earnings[$c->code] ?? 0);
        $category = $employee->taxpayer_category ?? 'general';
        $taxableBonuses = $bonuses->where('is_taxable', true)->sum('amount');
        $annualTax = $this->annualTax($taxableMonthly * 12 + $taxableBonuses + $overtimePay, $assessmentYear, $category);
        $tax = round($annualTax / 12, 2);
        $pfRate = (float) ($settings['provident_fund_employee_rate'] ?? 0);
        $pfEmployerRate = (float) ($settings['provident_fund_employer_rate'] ?? $pfRate);
        $pfEmployee = round($basic * $pfRate / 100, 2);
        $pfEmployer = round($basic * $pfEmployerRate / 100, 2);
        $installments = LoanInstallment::query()->where('status', 'pending')->whereDate('due_date', '<=', $periodEnd)
            ->whereHas('employeeLoan', fn ($q) => $q->where('employee_id', $employee->id)->where('status', 'active'))->get();
        $loanDeduction = round($installments->sum(fn ($x) => (float) $x->principal_amount + (float) $x->interest_amount), 2);
        $unpaidLeaveDays = (float) DB::table('leaves as l')->join('leave_types as t','t.id','=','l.leave_type_id')->where('l.employee_id',$employee->id)->where('l.status','approved')->where('t.is_paid',false)->whereDate('l.start_date','<=',$periodEnd)->whereDate('l.end_date','>=',$periodStart)->sum(DB::raw('COALESCE(l.requested_days,l.total_days)'));
        $absenceDays = ($settings['deduct_absence'] ?? true) ? (float) $attendanceSummary['absent_days'] : 0;
        $attendanceDeduction = round(($gross / 30) * ($unpaidLeaveDays + $absenceDays), 2);
        if ($attendanceDeduction > 0) $deductions['UNPAID_ABSENCE'] = $attendanceDeduction;
        $otherDeductions = array_sum($deductions);

        return [
            'gross_earnings' => $grossEarnings, 'tax_deduction' => $tax,
            'provident_fund_employee' => $pfEmployee, 'provident_fund_employer' => $pfEmployer,
            'loan_deduction' => $loanDeduction, 'other_deductions' => $otherDeductions,
            'net_pay' => round($grossEarnings - $tax - $pfEmployee - $loanDeduction - $otherDeductions, 2),
            'earnings' => $earnings,
            'deductions' => array_merge($deductions, ['INCOME_TAX' => $tax, 'PF_EMPLOYEE' => $pfEmployee, 'LOAN' => $loanDeduction]),
            'employer_contributions' => array_merge($employer, ['PF_EMPLOYER' => $pfEmployer]),
            'attendance_summary' => array_merge($attendanceSummary, ['unpaid_leave_days'=>$unpaidLeaveDays,'overtime_pay'=>$overtimePay]),
            'calculation_meta' => ['assessment_year' => $assessmentYear, 'annual_taxable_income' => $taxableMonthly * 12 + $taxableBonuses + $overtimePay, 'annual_tax' => $annualTax, 'salary_structure_id' => $assignment->salary_structure_id, 'loan_installment_ids' => $installments->pluck('id')->all(), 'bonus_ids' => $bonuses->pluck('id')->all()],
        ];
    }

    public function annualTax(float $taxableIncome, string $assessmentYear, string $category = 'general'): float
    {
        $slabs = DB::table('tax_slabs')->where('assessment_year', $assessmentYear)->where('taxpayer_category', $category)
            ->where('is_active', true)->orderBy('sequence')->get();
        if ($slabs->isEmpty()) throw new RuntimeException("Tax slabs are not configured for {$assessmentYear} ({$category})");
        $remaining = max(0, $taxableIncome); $tax = 0.0;
        foreach ($slabs as $slab) {
            if ($remaining <= 0) break;
            $band = $slab->amount === null ? $remaining : min($remaining, (float) $slab->amount);
            $tax += $band * (float) $slab->rate / 100; $remaining -= $band;
        }
        return round($tax, 2);
    }

    private function attendanceSummary(int $employeeId, Carbon $start, Carbon $end): array
    {
        $rows = DB::table('attendances')->where('employee_id', $employeeId)->whereBetween('date', [$start, $end])->get();
        return ['present_days' => $rows->whereIn('status', ['present', 'late', 'half_day'])->count(), 'absent_days' => $rows->where('status', 'absent')->count(), 'worked_minutes' => $rows->sum('worked_minutes'), 'overtime_minutes' => $rows->sum('overtime_minutes'), 'holiday_worked_minutes' => $rows->where('status','holiday')->sum('worked_minutes')];
    }
}
