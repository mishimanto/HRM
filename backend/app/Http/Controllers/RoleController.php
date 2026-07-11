<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        try {
            // Simple query without any complex relationships
            $roles = Role::where('is_active', true)
                        ->select('id', 'name', 'slug', 'is_active')
                        ->get();
            
            return response()->json($roles);
        } catch (\Exception $e) {
            \Log::error('Error fetching roles: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to fetch roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'slug' => 'required|string|max:255|unique:roles',
            'permissions' => 'nullable|array',
        ]);

        try {
            $role = Role::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'permissions' => $request->permissions,
                'is_active' => $request->is_active ?? true,
            ]);

            return response()->json([
                'role' => $role,
                'message' => 'Role created successfully'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Role $role)
    {
        try {
            return response()->json($role);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'slug' => 'required|string|max:255|unique:roles,slug,' . $role->id,
            'permissions' => 'nullable|array',
        ]);

        try {
            $role->update([
                'name' => $request->name,
                'slug' => $request->slug,
                'permissions' => $request->permissions ?? $role->permissions,
                'is_active' => $request->is_active ?? $role->is_active,
            ]);

            return response()->json([
                'role' => $role,
                'message' => 'Role updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Role $role)
    {
        try {
            // Check if role is being used by any user
            if ($role->users()->count() > 0) {
                return response()->json([
                    'message' => 'Cannot delete role. It is assigned to users.'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'message' => 'Role deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete role',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
