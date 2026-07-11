<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Get roles
        $adminRole = Role::where('slug', 'admin')->first();
        $hrRole = Role::where('slug', 'hr')->first();
        $managerRole = Role::where('slug', 'manager')->first();
        $employeeRole = Role::where('slug', 'employee')->first();

        // Create Admin User
        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password'),
            'role_id' => $adminRole->id,
            'phone' => '+8801XXXXXXXXX',
            'employee_id' => 'ADM001',
            'hire_date' => now(),
            'is_active' => true,
        ]);

        // Create HR Manager
        $hr = User::create([
            'name' => 'HR Manager',
            'email' => 'hr@gmail.com',
            'password' => Hash::make('password'),
            'role_id' => $hrRole->id,
            'phone' => '+8801XXXXXXXXX',
            'employee_id' => 'HR001',
            'hire_date' => now(),
            'is_active' => true,
        ]);

        // Create Department Manager
        $manager = User::create([
            'name' => 'Department Manager',
            'email' => 'manager@gmail.com',
            'password' => Hash::make('password'),
            'role_id' => $managerRole->id,
            'phone' => '+8801XXXXXXXXX',
            'employee_id' => 'MGR001',
            'hire_date' => now(),
            'is_active' => true,
        ]);

        // Create Regular Employee
        $employee = User::create([
            'name' => 'Regular Employee',
            'email' => 'employee@gmail.com',
            'password' => Hash::make('password'),
            'role_id' => $employeeRole->id,
            'phone' => '+8801XXXXXXXXX',
            'employee_id' => 'EMP001',
            'hire_date' => now(),
            'is_active' => true,
        ]);

        // Create employee records
        Employee::create([
            'user_id' => $admin->id,
            'employment_type' => 'full-time',
            'joining_date' => now(),
            'salary' => 100000,
        ]);

        Employee::create([
            'user_id' => $hr->id,
            'employment_type' => 'full-time',
            'joining_date' => now(),
            'salary' => 80000,
        ]);

        Employee::create([
            'user_id' => $manager->id,
            'employment_type' => 'full-time',
            'joining_date' => now(),
            'salary' => 70000,
        ]);

        Employee::create([
            'user_id' => $employee->id,
            'employment_type' => 'full-time',
            'joining_date' => now(),
            'salary' => 50000,
        ]);

        // Create multiple employees for testing
        $employees = [
            ['name' => 'John Doe', 'email' => 'john@gmail.com', 'employee_id' => 'EMP002'],
            ['name' => 'Jane Smith', 'email' => 'jane@gmail.com', 'employee_id' => 'EMP003'],
            ['name' => 'Mike Johnson', 'email' => 'mike@gmail.com', 'employee_id' => 'EMP004'],
            ['name' => 'Sarah Wilson', 'email' => 'sarah@gmail.com', 'employee_id' => 'EMP005'],
        ];

        foreach ($employees as $emp) {
            $user = User::create([
                'name' => $emp['name'],
                'email' => $emp['email'],
                'password' => Hash::make('password'),
                'role_id' => $employeeRole->id,
                'phone' => '+8801' . rand(100000000, 999999999),
                'employee_id' => $emp['employee_id'],
                'hire_date' => now(),
                'is_active' => true,
            ]);

            Employee::create([
                'user_id' => $user->id,
                'employment_type' => 'full-time',
                'joining_date' => now(),
                'salary' => rand(30000, 60000),
            ]);
        }

        $this->command->info('Users created successfully!');
        $this->command->info('Admin: admin@gmail.com / password');
        $this->command->info('HR: hr@gmail.com / password');
        $this->command->info('Manager: manager@gmail.com / password');
        $this->command->info('Employee: employee@gmail.com / password');
    }
}