<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use App\Models\Shift;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BangladeshPolicySeeder extends Seeder
{
    public function run(): void
    {
        $companyId = DB::table('companies')->updateOrInsert(
            ['name' => 'Default Company'],
            ['currency' => 'BDT', 'timezone' => 'Asia/Dhaka', 'country_code' => 'BD', 'is_active' => true, 'updated_at' => now(), 'created_at' => now()]
        );
        $companyId = DB::table('companies')->where('name', 'Default Company')->value('id');

        Shift::updateOrCreate(['code' => 'GENERAL'], [
            'company_id' => $companyId, 'name' => 'General Shift', 'starts_at' => '09:00', 'ends_at' => '18:00',
            'break_minutes' => 60, 'grace_minutes' => 10, 'standard_minutes' => 480,
            'overtime_after_minutes' => 480, 'weekly_off_days' => [5], 'is_active' => true,
        ]);

        foreach ([
            ['name' => 'Casual Leave', 'code' => 'CL', 'annual_entitlement' => 10, 'accrual_frequency' => 'yearly', 'is_paid' => true],
            ['name' => 'Sick Leave', 'code' => 'SL', 'annual_entitlement' => 14, 'accrual_frequency' => 'yearly', 'is_paid' => true, 'requires_document' => true],
            ['name' => 'Earned Leave', 'code' => 'EL', 'annual_entitlement' => 0, 'accrual_frequency' => 'none', 'worked_days_divisor' => 18, 'max_carry_forward' => 40, 'is_paid' => true, 'is_encashable' => true],
            ['name' => 'Maternity Leave', 'code' => 'ML', 'annual_entitlement' => 120, 'accrual_frequency' => 'none', 'minimum_service_days' => 180, 'is_paid' => true, 'gender_specific' => true, 'eligible_gender' => 'female'],
            ['name' => 'Leave Without Pay', 'code' => 'LWP', 'annual_entitlement' => 0, 'accrual_frequency' => 'none', 'is_paid' => false],
        ] as $type) {
            LeaveType::updateOrCreate(['company_id' => $companyId, 'code' => $type['code']], array_merge([
                'company_id' => $companyId, 'accrual_amount' => 0, 'max_carry_forward' => 0,
                'minimum_service_days' => 0, 'requires_document' => false, 'is_encashable' => false,
                'gender_specific' => false, 'is_active' => true,
            ], $type));
        }
    }
}
