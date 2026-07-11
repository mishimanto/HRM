<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function myProfile(Request $request)
    {
        $employee = Employee::with(['user.role','department','position'])->where('user_id', $request->user()->id)->first();
        abort_unless($employee, 404, 'Employee record not found');
        return response()->json(['employee' => $employee]);
    }
    public function index(Request $request)
    {
        $employees = Employee::with(['user.role', 'department', 'position'])
            ->when($request->search, function($query, $search) {
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->when($request->department_id, function($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->employment_type, function($query, $employmentType) {
                $query->where('employment_type', $employmentType);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'employee_id' => 'required|string|unique:users,employee_id',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            'salary' => 'required|numeric|min:0',
            'employment_type' => 'required|in:full-time,part-time,contract,intern',
            'joining_date' => 'required|date',
            'role_id' => 'required|exists:roles,id', // Role validation added
            'password' => 'sometimes|string|min:8',
        ]);

        DB::transaction(function () use ($request) {
            // Generate a random password if not provided
            $password = $request->password ?: 'password123';

            // Create user first
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'employee_id' => $request->employee_id,
                'password' => Hash::make($password),
                'role_id' => $request->role_id, // Use selected role
                'is_active' => true,
                'hire_date' => $request->joining_date,
            ]);

            // Create employee and link to user
            $employee = Employee::create([
                'user_id' => $user->id,
                'department_id' => $request->department_id,
                'position_id' => $request->position_id,
                'salary' => $request->salary,
                'employment_type' => $request->employment_type,
                'joining_date' => $request->joining_date,
            ]);
        });

        return response()->json([
            'message' => 'Employee created successfully'
        ], 201);
    }

    public function show(Employee $employee)
    {
        return response()->json([
            'employee' => $employee->load(['user.role', 'department', 'position', 'attendances', 'leaves'])
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($employee->user_id)
            ],
            'phone' => 'required|string|max:20',
            'employee_id' => [
                'required',
                'string',
                Rule::unique('users')->ignore($employee->user_id)
            ],
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            'salary' => 'required|numeric|min:0',
            'employment_type' => 'required|in:full-time,part-time,contract,intern',
            'joining_date' => 'required|date',
            'role_id' => 'required|exists:roles,id', // Role update added
            // Password field removed from update
        ]);

        DB::transaction(function () use ($request, $employee) {
            // Prepare user update data
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'employee_id' => $request->employee_id,
                'hire_date' => $request->joining_date,
                'role_id' => $request->role_id, // Update role
            ];

            // Update user information
            $employee->user->update($userData);

            // Prepare employee data
            $employeeData = [
                'department_id' => $request->department_id ?: null,
                'position_id' => $request->position_id ?: null,
                'salary' => $request->salary,
                'employment_type' => $request->employment_type,
                'joining_date' => $request->joining_date,
            ];

            // Update employee information
            $employee->update($employeeData);
        });

        // Refresh the relationships
        $employee->load(['user', 'department', 'position']);

        return response()->json([
            'employee' => $employee,
            'message' => 'Employee updated successfully'
        ]);
    }

    public function destroy(Employee $employee)
    {
        DB::transaction(function () use ($employee) {
            // Delete the user as well
            $employee->user->delete();
            $employee->delete();
        });

        return response()->json([
            'message' => 'Employee deleted successfully'
        ]);
    }

    public function dashboardStats()
    {
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::whereHas('user', function($query) {
            $query->where('is_active', true);
        })->count();
        
        $departmentStats = DB::table('employees')
            ->join('departments', 'employees.department_id', '=', 'departments.id')
            ->select('departments.name', DB::raw('COUNT(employees.id) as employee_count'))
            ->groupBy('departments.id', 'departments.name')
            ->get();

        $employmentTypeStats = DB::table('employees')
            ->select('employment_type', DB::raw('COUNT(*) as count'))
            ->groupBy('employment_type')
            ->get();

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'department_stats' => $departmentStats,
            'employment_type_stats' => $employmentTypeStats,
        ]);
    }
}
