<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function index(Request $request)
    {
        $positions = Position::with(['department', 'employees.user'])
            ->when($request->department_id, function($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when($request->search, function($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->orderBy('title')
            ->get();

        return response()->json($positions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'description' => 'nullable|string',
            'min_salary' => 'required|numeric|min:0',
            'max_salary' => 'required|numeric|min:0|gte:min_salary',
        ]);

        $position = Position::create($request->all());

        return response()->json([
            'position' => $position->load('department'),
            'message' => 'Position created successfully'
        ], 201);
    }

    public function show(Position $position)
    {
        return response()->json([
            'position' => $position->load(['department', 'employees.user'])
        ]);
    }

    public function update(Request $request, Position $position)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'description' => 'nullable|string',
            'min_salary' => 'required|numeric|min:0',
            'max_salary' => 'required|numeric|min:0|gte:min_salary',
        ]);

        $position->update($request->all());

        return response()->json([
            'position' => $position->load('department'),
            'message' => 'Position updated successfully'
        ]);
    }

    public function destroy(Position $position)
    {
        if ($position->employees()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete position that has employees assigned'
            ], 422);
        }

        $position->delete();

        return response()->json([
            'message' => 'Position deleted successfully'
        ]);
    }
}