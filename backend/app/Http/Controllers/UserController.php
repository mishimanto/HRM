<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['role', 'employee.department'])
            ->when($request->search, function($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('employee_id', 'like', "%{$search}%");
            })
            ->when($request->role, function($query, $role) {
                $query->whereHas('role', function($q) use ($role) {
                    $q->where('slug', $role);
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role_id' => 'required|exists:roles,id',
            'phone' => 'required|string|max:20',
            'employee_id' => 'required|string|unique:users',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            'salary' => 'nullable|numeric',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'phone' => $request->phone,
            'employee_id' => $request->employee_id,
            'hire_date' => $request->hire_date ?? now(),
        ]);

        // Create employee record
        $user->employee()->create([
            'department_id' => $request->department_id,
            'position_id' => $request->position_id,
            'salary' => $request->salary ?? 0,
            'employment_type' => $request->employment_type ?? 'full-time',
            'joining_date' => $request->hire_date ?? now(),
        ]);

        return response()->json([
            'user' => $user->load(['role', 'employee.department', 'employee.position']),
            'message' => 'User created successfully'
        ], 201);
    }

    public function show(User $user)
    {
        return response()->json([
            'user' => $user->load(['role', 'employee.department', 'employee.position'])
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
            'phone' => 'required|string|max:20',
            'employee_id' => 'required|string|unique:users,employee_id,' . $user->id,
        ]);

        $user->update($request->only(['name', 'email', 'role_id', 'phone', 'employee_id']));

        if ($user->employee && $request->has('department_id')) {
            $user->employee->update([
                'department_id' => $request->department_id,
                'position_id' => $request->position_id,
                'salary' => $request->salary,
                'employment_type' => $request->employment_type,
            ]);
        }

        return response()->json([
            'user' => $user->load(['role', 'employee.department', 'employee.position']),
            'message' => 'User updated successfully'
        ]);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    public function updateProfile(Request $request, User $user)
    {
        // Check if the authenticated user can update this profile
        if ($request->user()->id !== $user->id && !$request->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'current_password' => 'sometimes|required|string',
            'password' => 'sometimes|required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // If password is being updated
        if ($request->has('password')) {
            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Update password
            $user->update([
                'password' => Hash::make($request->password)
            ]);
        }

        // Update profile information
        $user->update($request->only(['name', 'email', 'phone']));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }
}