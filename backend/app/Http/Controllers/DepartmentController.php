<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::with(['manager', 'employees.user', 'positions'])
            ->get();

        return response()->json($departments);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:departments',
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department = Department::create($request->all());

        return response()->json([
            'department' => $department->load('manager'),
            'message' => 'Department created successfully'
        ], 201);
    }

    public function show(Department $department)
    {
        return response()->json([
            'department' => $department->load(['manager', 'employees.user', 'positions'])
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:departments,name,' . $department->id,
            'description' => 'nullable|string',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        $department->update($request->all());

        return response()->json([
            'department' => $department->load('manager'),
            'message' => 'Department updated successfully'
        ]);
    }

    public function destroy(Department $department)
    {
        if ($department->employees()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete department with employees'
            ], 422);
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully'
        ]);
    }
}