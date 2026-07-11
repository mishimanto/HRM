<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\Employee;
use App\Models\Department;
use App\Models\User;
use App\Models\TaskComment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    // TaskController.php - index method e department filter add korun
public function index(Request $request): JsonResponse
{
    try {
        $user = $request->user();
        $query = Task::with(['assignedTo.user', 'assignedBy', 'department']);

        // Filter based on user role
        if ($user->role_id == 4) { // Employee
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee) {
                $query->where('assigned_to', $employee->id);
            }
        } elseif ($user->role_id == 3) { // Manager
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $employee->department_id) {
                $query->where('department_id', $employee->department_id);
            }
        }

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        // ✅ Department filter - শুধু employee না হলে apply করবে
        if ($user->role_id != 4 && $request->has('department_id') && $request->department_id !== 'all') {
            $query->where('department_id', $request->department_id);
        }

        $tasks = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($tasks);

    } catch (\Exception $e) {
        Log::error('Error fetching tasks: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error fetching tasks',
            'error' => $e->getMessage()
        ], 500);
    }
}

public function store(Request $request): JsonResponse
{
    try {
        \Log::info('=== TASK CREATION STARTED ===');
        \Log::info('Request data:', $request->all());
        \Log::info('Has attachment:', ['has_attachment' => $request->hasFile('attachment')]);
        
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            \Log::info('Attachment details:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:employees,id',
            'department_id' => 'nullable|exists:departments,id',
            'priority' => 'required|in:low,medium,high,urgent',
            'due_date' => 'required|date|after:today',
            'attachment' => 'nullable|file|max:10240',
        ]);

        \Log::info('Validation passed');

        $attachmentPath = null;
        
        // Handle single attachment
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            
            try {
                $attachmentPath = $file->store('task_attachments', 'public');
                \Log::info('File stored successfully:', ['path' => $attachmentPath]);
                
                // Check if file actually exists
                if (!\Storage::disk('public')->exists($attachmentPath)) {
                    \Log::error('File storage failed - file does not exist at path: ' . $attachmentPath);
                } else {
                    \Log::info('File exists at path: ' . $attachmentPath);
                }
            } catch (\Exception $e) {
                \Log::error('File storage error: ' . $e->getMessage());
            }
        }

        \Log::info('Creating task with data:', [
            'title' => $request->title,
            'assigned_to' => $request->assigned_to,
            'attachment_path' => $attachmentPath
        ]);

        $taskData = [
            'title' => $request->title,
            'description' => $request->description,
            'assigned_to' => $request->assigned_to,
            'assigned_by' => $request->user()->id,
            'department_id' => $request->department_id,
            'priority' => $request->priority,
            'due_date' => $request->due_date,
            'status' => 'pending',
            'progress' => 0,
            'attachment_path' => $attachmentPath,
        ];

        \Log::info('Final task data:', $taskData);

        $task = Task::create($taskData);

        \Log::info('Task created successfully:', [
            'task_id' => $task->id,
            'attachment_path' => $task->attachment_path
        ]);

        // Verify the task was saved with attachment
        $freshTask = Task::find($task->id);
        \Log::info('Task from database:', [
            'attachment_path' => $freshTask->attachment_path
        ]);

        $task->load(['assignedTo.user', 'assignedBy', 'department']);

        \Log::info('=== TASK CREATION COMPLETED ===');

        return response()->json($task, 201);

    } catch (\Exception $e) {
        \Log::error('Error creating task: ' . $e->getMessage());
        \Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json([
            'message' => 'Error creating task',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function show($id): JsonResponse
    {
        try {
            $task = Task::with([
                'assignedTo.user',
                'assignedBy',
                'department',
                'comments.user'
            ])->find($id);

            if (!$task) {
                return response()->json(['message' => 'Task not found'], 404);
            }

            // Check authorization for employees
            $user = auth()->user();
            if ($user->role_id == 4) { // Employee role
                $employee = Employee::where('user_id', $user->id)->first();
                if (!$employee || $task->assigned_to !== $employee->id) {
                    return response()->json(['message' => 'Unauthorized to view this task'], 403);
                }
            }

            // Build response data
            $taskData = [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority,
                'status' => $task->status,
                'due_date' => $task->due_date ? $task->due_date->format('Y-m-d') : null,
                'progress' => $task->progress,
                'attachment_path' => $task->attachment_path,
                'created_at' => $task->created_at,
                'updated_at' => $task->updated_at,
                'completed_at' => $task->completed_at,
                'is_overdue' => $task->due_date && 
                               $task->due_date->isPast() && 
                               !in_array($task->status, ['completed', 'cancelled'])
            ];

            // Add assigned_to relationship
            if ($task->assignedTo && $task->assignedTo->user) {
                $taskData['assigned_to'] = [
                    'id' => $task->assignedTo->id,
                    'user' => [
                        'id' => $task->assignedTo->user->id,
                        'name' => $task->assignedTo->user->name,
                        'employee_id' => $task->assignedTo->user->employee_id
                    ]
                ];
            } else {
                $taskData['assigned_to'] = null;
            }

            // Add assigned_by relationship
            if ($task->assignedBy) {
                $taskData['assigned_by'] = [
                    'id' => $task->assignedBy->id,
                    'name' => $task->assignedBy->name
                ];
            } else {
                $taskData['assigned_by'] = null;
            }

            // Add department relationship
            if ($task->department) {
                $taskData['department'] = [
                    'id' => $task->department->id,
                    'name' => $task->department->name
                ];
            } else {
                $taskData['department'] = null;
            }

            // Add comments
            $taskData['comments'] = $task->comments->map(function($comment) {
                return [
                    'id' => $comment->id,
                    'comment' => $comment->comment,
                    'created_at' => $comment->created_at,
                    'user' => $comment->user ? [
                        'id' => $comment->user->id,
                        'name' => $comment->user->name
                    ] : null
                ];
            });

            return response()->json($taskData);

        } catch (\Exception $e) {
            Log::error('Error in TaskController show method: ' . $e->getMessage());
            return response()->json([
                'message' => 'Internal server error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // TaskController.php - update method
public function update(Request $request, $id): JsonResponse
{
    try {
        $task = Task::find($id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        if ($user->role_id == 4) { // Employee
            if (!$employee || $task->assigned_to !== $employee->id) {
                return response()->json(['message' => 'You can only update tasks assigned to you'], 403);
            }
            
            $validated = $request->validate([
                'status' => 'sometimes|in:pending,in_progress,review,completed,cancelled',
                'progress' => 'sometimes|integer|min:0|max:100',
            ]);

            $allowedFields = ['status', 'progress'];
            $validated = array_intersect_key($validated, array_flip($allowedFields));

        } else {
            // Admin/HR/Manager
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'sometimes|in:pending,in_progress,review,completed,cancelled',
                'priority' => 'sometimes|required|in:low,medium,high,urgent',
                'due_date' => 'sometimes|required|date',
                'attachment' => 'nullable|file|max:10240', // ✅ Single attachment
            ]);

            // Handle attachment update
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $attachmentPath = $file->store('task_attachments', 'public');
                $validated['attachment_path'] = $attachmentPath;
            }

            if (isset($validated['progress'])) {
                unset($validated['progress']);
            }
        }

        // Update completed_at if status changed to completed
        if (isset($validated['status']) && $validated['status'] === 'completed') {
            $validated['completed_at'] = now();
            if ($user->role_id == 4) {
                $validated['progress'] = 100;
            }
        }

        $task->update($validated);
        $task->load(['assignedTo.user', 'assignedBy', 'department']);

        return response()->json($task);

    } catch (\Exception $e) {
        Log::error('Error updating task: ' . $e->getMessage());
        return response()->json([
            'message' => 'Error updating task',
            'error' => $e->getMessage()
        ], 500);
    }
}


    public function destroy($id): JsonResponse
    {
        try {
            $task = Task::find($id);
            if (!$task) {
                return response()->json(['message' => 'Task not found'], 404);
            }

            // Check authorization - only admin/hr can delete tasks
            $user = auth()->user();
            if (!in_array($user->role_id, [1, 2])) {
                return response()->json(['message' => 'Unauthorized to delete tasks'], 403);
            }

            $task->delete();

            return response()->json(['message' => 'Task deleted successfully']);

        } catch (\Exception $e) {
            Log::error('Error deleting task: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error deleting task',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function myTasks(Request $request): JsonResponse
    {
        try {
            $employee = Employee::where('user_id', $request->user()->id)->first();
            
            if (!$employee) {
                return response()->json(['message' => 'Employee profile not found'], 404);
            }

            $tasks = Task::with(['assignedTo.user', 'assignedBy', 'department'])
                ->where('assigned_to', $employee->id)
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json($tasks);

        } catch (\Exception $e) {
            Log::error('Error fetching my tasks: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching tasks',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getTaskStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Task::query();

            // Filter based on user role
            if ($user->role_id == 4) { // Employee
                $employee = Employee::where('user_id', $user->id)->first();
                if ($employee) {
                    $query->where('assigned_to', $employee->id);
                }
            } elseif ($user->role_id == 3) { // Manager
                $employee = Employee::where('user_id', $user->id)->first();
                if ($employee && $employee->department_id) {
                    $query->where('department_id', $employee->department_id);
                }
            }

            $now = now()->format('Y-m-d');
            
            $stats = [
                'total' => $query->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'in_progress' => (clone $query)->where('status', 'in_progress')->count(),
                'review' => (clone $query)->where('status', 'review')->count(),
                'completed' => (clone $query)->where('status', 'completed')->count(),
                'overdue' => (clone $query)->where('due_date', '<', $now)
                    ->whereNotIn('status', ['completed', 'cancelled'])->count(),
            ];

            return response()->json($stats);
            
        } catch (\Exception $e) {
            Log::error('Error fetching task stats: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEmployeesByDepartment($departmentId): JsonResponse
    {
        try {
            $employees = Employee::with(['user'])
                ->where('department_id', $departmentId)
                ->whereHas('user', function($query) {
                    $query->where('is_active', 1);
                })
                ->get()
                ->map(function($employee) {
                    return [
                        'id' => $employee->id,
                        'name' => $employee->user->name,
                        'employee_id' => $employee->user->employee_id,
                    ];
                });

            return response()->json($employees);
        } catch (\Exception $e) {
            Log::error('Error fetching employees by department: ' . $e->getMessage());
            return response()->json(['message' => 'Error fetching employees'], 500);
        }
    }

    public function downloadAttachment($id)
    {
        try {
            $task = Task::find($id);
            if (!$task) {
                return response()->json(['message' => 'Task not found'], 404);
            }

            if (!$task->attachment_path) {
                return response()->json(['message' => 'No attachment found'], 404);
            }

            if (!Storage::disk('public')->exists($task->attachment_path)) {
                return response()->json(['message' => 'File not found'], 404);
            }

            // Check authorization
            $user = auth()->user();
            if ($user->role_id == 4) {
                $employee = Employee::where('user_id', $user->id)->first();
                if (!$employee || $task->assigned_to !== $employee->id) {
                    return response()->json(['message' => 'Unauthorized to access this attachment'], 403);
                }
            }

            return Storage::disk('public')->download($task->attachment_path);
            
        } catch (\Exception $e) {
            Log::error('Error downloading attachment: ' . $e->getMessage());
            return response()->json(['message' => 'Error downloading file'], 500);
        }
    }

    public function downloadAttachmentById($attachmentId)
{
    try {
        $attachment = TaskAttachment::find($attachmentId);
        
        if (!$attachment) {
            return response()->json(['message' => 'Attachment not found'], 404);
        }

        // Check authorization
        $user = auth()->user();
        $task = $attachment->task;
        
        if ($user->role_id == 4) { // Employee
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee || $task->assigned_to !== $employee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
        
    } catch (\Exception $e) {
        Log::error('Error downloading attachment: ' . $e->getMessage());
        return response()->json(['message' => 'Error downloading file'], 500);
    }
}

    public function storeComment(Request $request, $id): JsonResponse
    {
        try {
            $task = Task::find($id);
            if (!$task) {
                return response()->json(['message' => 'Task not found'], 404);
            }

            $request->validate([
                'comment' => 'required|string|max:1000'
            ]);

            // Check authorization
            $user = $request->user();
            if ($user->role_id == 4) {
                $employee = Employee::where('user_id', $user->id)->first();
                if (!$employee || $task->assigned_to !== $employee->id) {
                    return response()->json(['message' => 'Unauthorized to comment on this task'], 403);
                }
            }

            $comment = TaskComment::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'comment' => $request->comment
            ]);

            $comment->load('user');

            return response()->json($comment, 201);
            
        } catch (\Exception $e) {
            Log::error('Error storing comment: ' . $e->getMessage());
            return response()->json(['message' => 'Error adding comment'], 500);
        }
    }
    public function getDepartments(): JsonResponse
{
    try {
        $departments = \App\Models\Department::select('id', 'name')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json($departments);
    } catch (\Exception $e) {
        \Log::error('Error fetching departments: ' . $e->getMessage());
        return response()->json(['message' => 'Error fetching departments'], 500);
    }
}
    
}