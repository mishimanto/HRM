<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Models\Role;
use App\Models\User;
use App\Services\LeaveAccrualService;
use App\Services\LeaveBalanceService;
use App\Services\LeaveDayCalculator;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LeavePolicyEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_working_days_exclude_weekly_off_and_holidays(): void
    {
        [, $employee] = $this->employee();
        DB::table('holidays')->insert(['name'=>'Holiday','date'=>'2026-07-11','type'=>'government','created_at'=>now(),'updated_at'=>now()]);
        $this->assertSame(1.0, app(LeaveDayCalculator::class)->calculate($employee, '2026-07-09', '2026-07-11'));
    }

    public function test_monthly_accrual_is_idempotent(): void
    {
        [, $employee] = $this->employee();
        $type = LeaveType::create(['name'=>'Casual','code'=>'CL','accrual_frequency'=>'monthly','accrual_amount'=>1.5,'is_active'=>true]);
        $service = app(LeaveAccrualService::class);
        $service->accrueMonth(Carbon::parse('2026-07-01'));
        $service->accrueMonth(Carbon::parse('2026-07-01'));
        $this->assertDatabaseHas('leave_balances', ['employee_id'=>$employee->id,'leave_type_id'=>$type->id,'accrued'=>1.5]);
        $this->assertSame(1, DB::table('leave_transactions')->count());
    }

    public function test_approved_leave_consumes_balance_once(): void
    {
        [$user, $employee] = $this->employee();
        $type = LeaveType::create(['name'=>'Casual','code'=>'CL','is_paid'=>true,'is_active'=>true]);
        DB::table('leave_balances')->insert(['employee_id'=>$employee->id,'leave_type_id'=>$type->id,'year'=>2026,'accrued'=>5,'created_at'=>now(),'updated_at'=>now()]);
        $leave = Leave::create(['employee_id'=>$employee->id,'leave_type_id'=>$type->id,'leave_type'=>'CL','start_date'=>'2026-07-12','end_date'=>'2026-07-13','total_days'=>2,'requested_days'=>2,'reason'=>'Test','status'=>'pending']);
        $service = app(LeaveBalanceService::class);
        $service->consume($leave, $user->id);
        $service->consume($leave, $user->id);
        $this->assertEquals(2.0, (float) DB::table('leave_balances')->where('employee_id',$employee->id)->value('used'));
        $this->assertSame(1, DB::table('leave_transactions')->count());
    }

    private function employee(): array
    {
        $role = Role::create(['name'=>'Employee','slug'=>'employee'.uniqid(),'permissions'=>[],'is_active'=>true]);
        $user = User::factory()->create(['role_id'=>$role->id,'is_active'=>true]);
        $employee = Employee::create(['user_id'=>$user->id,'joining_date'=>'2025-01-01','employment_type'=>'full-time','salary'=>0]);
        return [$user, $employee];
    }
}
