<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'permissions' => ['*'],
                'is_active' => true
            ],
            [
                'name' => 'HR Manager',
                'slug' => 'hr',
                'permissions' => [
                    'user.manage', 'employee.view', 'employee.manage',
                    'attendance.view', 'attendance.manage',
                    'leave.view', 'leave.approve',
                    'payroll.view', 'payroll.manage', 'payroll.approve',
                    'department.view', 'department.manage',
                    'document.manage', 'report.view', 'role.view', 'bulk.manage', 'policy.manage',
                    'recruitment.manage', 'lifecycle.manage', 'performance.manage', 'training.manage',
                    'expense.manage', 'asset.manage', 'benefit.manage', 'grievance.manage', 'communication.manage',
                    'approval.manage', 'data.manage'
                ],
                'is_active' => true
            ],
            [
                'name' => 'Department Manager',
                'slug' => 'manager',
                'permissions' => [
                    'employee.view', 'attendance.view', 'leave.view', 'leave.approve',
                    'department.view', 'report.view', 'performance.manage', 'training.manage', 'approval.manage'
                ],
                'is_active' => true
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'permissions' => [
                    'attendance.self', 'leave.self', 'payroll.self', 'document.self', 'task.self'
                ],
                'is_active' => true
            ]
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }
    }
}
