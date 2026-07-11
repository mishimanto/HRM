<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\BulkOperationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\WorkforcePolicyController;
use App\Http\Controllers\PayrollEngineController;
use App\Http\Controllers\TalentLifecycleController;
use App\Http\Controllers\EmployeeServicesController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\SelfServiceController;
use App\Http\Controllers\AnalyticsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum', 'audit'])->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'user']);
    Route::post('/me/update', [AuthController::class, 'updateProfile']);
    Route::post('/me/change-password', [AuthController::class, 'changePassword']);

    // User management (Admin/HR only)
    Route::apiResource('users', UserController::class)->except(['create', 'edit'])
        ->middleware('permission:user.manage');
    Route::put('/users/{user}/profile', [UserController::class, 'updateProfile']);

    // Dashboard routes
Route::get('/dashboard/stats', [DashboardController::class, 'dashboardStats']);
    
    // Department management
    Route::apiResource('departments', DepartmentController::class)->except(['create', 'edit'])
        ->middleware('permission:department.view,department.manage');
    
    // Position management
    Route::apiResource('positions', PositionController::class)->except(['create', 'edit'])
        ->middleware('permission:department.view,department.manage');
    
    // Employee management
    Route::apiResource('employees', EmployeeController::class)->except(['create', 'edit'])
        ->middleware('permission:employee.view,employee.manage');
    Route::get('/employees/dashboard-stats', [ReportController::class, 'dashboardStats'])
        ->middleware('permission:report.view');
    Route::get('/employees/for-bulk-attendance', [EmployeeController::class, 'employeesForBulkAttendance'])
        ->middleware('permission:attendance.manage');
    
    // ADD THIS ROUTE
    Route::get('/employees/my-profile', [EmployeeController::class, 'myProfile']);
    
    // Attendance routes
    Route::get('/attendances', [AttendanceController::class, 'index'])->middleware('permission:attendance.view');
    Route::post('/attendances', [AttendanceController::class, 'store'])->middleware('permission:attendance.manage');
    Route::get('/attendances/report/monthly', [AttendanceController::class, 'monthlyReport'])->middleware('permission:attendance.view');
    Route::post('/attendances/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendances/check-out', [AttendanceController::class, 'checkOut']);
    Route::get('/attendances/my-attendance', [AttendanceController::class, 'myAttendance']);
    Route::post('/attendances/my-checkin', [AttendanceController::class, 'checkIn']);
    Route::post('/attendances/my-checkout', [AttendanceController::class, 'checkOut']);
    Route::get('/attendances/{attendance}', [AttendanceController::class, 'show'])->middleware('permission:attendance.view');
    Route::put('/attendances/{attendance}', [AttendanceController::class, 'update'])->middleware('permission:attendance.manage');
    
    // Leave routes
    Route::get('/leaves', [LeaveController::class, 'index'])->middleware('permission:leave.view');
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::get('/leaves/{leave}', [LeaveController::class, 'show'])->middleware('permission:leave.view');
    Route::delete('/leaves/{leave}', [LeaveController::class, 'destroy']);
    Route::patch('/leaves/{leave}/status', [LeaveController::class, 'updateStatus'])->middleware('permission:leave.approve');
    Route::get('/my-leaves', [LeaveController::class, 'employeeLeaves']);
    
    // Payroll routes
    Route::apiResource('payrolls', PayrollController::class)->except(['create', 'edit'])
        ->middleware('permission:payroll.manage');
    Route::get('/my-payrolls', [PayrollController::class, 'employeePayrolls']);
    Route::get('/payroll-engine/components', [PayrollEngineController::class, 'components'])->middleware('permission:payroll.manage');
    Route::get('/payroll-engine/overview', [PayrollEngineController::class, 'overview'])->middleware('permission:payroll.manage');
    Route::post('/payroll-engine/components', [PayrollEngineController::class, 'storeComponent'])->middleware('permission:payroll.manage');
    Route::get('/payroll-engine/structures', [PayrollEngineController::class, 'structures'])->middleware('permission:payroll.manage');
    Route::post('/payroll-engine/structures', [PayrollEngineController::class, 'storeStructure'])->middleware('permission:payroll.manage');
    Route::post('/payroll-engine/assign-structure', [PayrollEngineController::class, 'assignStructure'])->middleware('permission:payroll.manage');
    Route::get('/payroll-engine/tax-slabs', [PayrollEngineController::class, 'taxSlabs'])->middleware('permission:payroll.manage');
    Route::post('/payroll-engine/tax-slabs', [PayrollEngineController::class, 'storeTaxSlabs'])->middleware('permission:payroll.manage');
    Route::get('/payroll-runs', [PayrollEngineController::class, 'runs'])->middleware('permission:payroll.manage');
    Route::post('/payroll-runs', [PayrollEngineController::class, 'storeRun'])->middleware('permission:payroll.manage');
    Route::post('/payroll-runs/{payrollRun}/calculate', [PayrollEngineController::class, 'calculate'])->middleware('permission:payroll.manage');
    Route::post('/payroll-runs/{payrollRun}/approve', [PayrollEngineController::class, 'approve'])->middleware('permission:payroll.approve');
    Route::post('/payroll-runs/{payrollRun}/mark-paid', [PayrollEngineController::class, 'markPaid'])->middleware('permission:payroll.approve');
    Route::get('/payslips/{payrollItem}', [PayrollEngineController::class, 'payslip'])->middleware('permission:payroll.manage');
    Route::get('/payslips/{payrollItem}/pdf', [PayrollEngineController::class, 'payslipPdf']);
    Route::get('/my-payslips', [PayrollEngineController::class, 'myPayslips']);
    Route::post('/employee-loans', [PayrollEngineController::class, 'storeLoan'])->middleware('permission:payroll.manage');
    Route::post('/employee-bonuses', [PayrollEngineController::class, 'storeBonus'])->middleware('permission:payroll.manage');
    Route::post('/final-settlements', [PayrollEngineController::class, 'createFinalSettlement'])->middleware('permission:payroll.manage');

    // Document routes
    Route::apiResource('documents', DocumentController::class)->except(['create', 'edit'])
        ->middleware('permission:document.manage');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('/documents-expiring', [DocumentController::class, 'expiring'])->middleware('permission:document.manage');
    Route::get('/my-documents', [DocumentController::class, 'employeeDocuments']);

    // Calendar routes
    Route::get('/calendar/events', [CalendarController::class, 'events'])->middleware('permission:report.view');
    Route::get('/calendar/my-events', [CalendarController::class, 'myEvents']);

    Route::get('/holidays', [WorkforcePolicyController::class, 'holidays']);
    Route::post('/holidays', [WorkforcePolicyController::class, 'storeHoliday'])->middleware('permission:policy.manage');
    Route::put('/holidays/{holiday}', [WorkforcePolicyController::class, 'updateHoliday'])->middleware('permission:policy.manage');
    Route::delete('/holidays/{holiday}', [WorkforcePolicyController::class, 'destroyHoliday'])->middleware('permission:policy.manage');
    Route::get('/shifts', [WorkforcePolicyController::class, 'shifts']);
    Route::post('/shifts', [WorkforcePolicyController::class, 'storeShift'])->middleware('permission:policy.manage');
    Route::put('/shifts/{shift}', [WorkforcePolicyController::class, 'updateShift'])->middleware('permission:policy.manage');
    Route::post('/shift-assignments', [WorkforcePolicyController::class, 'assignShift'])->middleware('permission:attendance.manage');
    Route::get('/leave-types', [WorkforcePolicyController::class, 'leaveTypes']);
    Route::post('/leave-types', [WorkforcePolicyController::class, 'storeLeaveType'])->middleware('permission:policy.manage');
    Route::put('/leave-types/{leaveType}', [WorkforcePolicyController::class, 'updateLeaveType'])->middleware('permission:policy.manage');
    Route::get('/leave-balances', [WorkforcePolicyController::class, 'balances']);

    Route::middleware('permission:recruitment.manage')->group(function () {
        Route::get('/talent/overview', [TalentLifecycleController::class, 'overview']);
        Route::get('/requisitions', [TalentLifecycleController::class, 'requisitions']);
        Route::post('/requisitions', [TalentLifecycleController::class, 'storeRequisition']);
        Route::patch('/requisitions/{id}/status', [TalentLifecycleController::class, 'requisitionStatus']);
        Route::get('/candidates', [TalentLifecycleController::class, 'candidates']);
        Route::post('/candidates', [TalentLifecycleController::class, 'storeCandidate']);
        Route::post('/applications', [TalentLifecycleController::class, 'apply']);
        Route::patch('/applications/{id}/stage', [TalentLifecycleController::class, 'applicationStage']);
        Route::post('/interviews', [TalentLifecycleController::class, 'scheduleInterview']);
        Route::patch('/interviews/{id}/result', [TalentLifecycleController::class, 'interviewResult']);
    });
    Route::middleware('permission:lifecycle.manage')->group(function () {
        Route::post('/onboarding', [TalentLifecycleController::class, 'startOnboarding']);
        Route::patch('/onboarding/tasks/{id}/complete', [TalentLifecycleController::class, 'completeOnboardingTask']);
        Route::post('/offboarding', [TalentLifecycleController::class, 'startOffboarding']);
        Route::patch('/offboarding/clearances/{id}', [TalentLifecycleController::class, 'clearance']);
    });
    Route::middleware('permission:performance.manage')->group(function () {
        Route::post('/performance/cycles', [TalentLifecycleController::class, 'storePerformanceCycle']);
        Route::post('/performance/goals', [TalentLifecycleController::class, 'storeGoal']);
        Route::post('/performance/reviews', [TalentLifecycleController::class, 'storeReview']);
    });
    Route::middleware('permission:training.manage')->group(function () {
        Route::post('/training/courses', [TalentLifecycleController::class, 'storeCourse']);
        Route::post('/training/enrollments', [TalentLifecycleController::class, 'enroll']);
        Route::patch('/training/enrollments/{id}/complete', [TalentLifecycleController::class, 'completeTraining']);
    });
    Route::get('/expenses', [EmployeeServicesController::class, 'expenses']);
    Route::get('/employee-services/overview', [EmployeeServicesController::class, 'overview']);
    Route::post('/expenses', [EmployeeServicesController::class, 'storeExpense']);
    Route::patch('/expenses/{id}/status', [EmployeeServicesController::class, 'expenseStatus'])->middleware('permission:expense.manage');
    Route::middleware('permission:asset.manage')->group(function () {
        Route::get('/assets', [EmployeeServicesController::class, 'assets']);
        Route::post('/assets', [EmployeeServicesController::class, 'storeAsset']);
        Route::post('/asset-assignments', [EmployeeServicesController::class, 'assignAsset']);
        Route::patch('/asset-assignments/{id}/return', [EmployeeServicesController::class, 'returnAsset']);
    });
    Route::middleware('permission:benefit.manage')->group(function () {
        Route::post('/benefit-plans', [EmployeeServicesController::class, 'storeBenefitPlan']);
        Route::post('/benefit-enrollments', [EmployeeServicesController::class, 'enrollBenefit']);
    });
    Route::get('/grievances', [EmployeeServicesController::class, 'grievances']);
    Route::post('/grievances', [EmployeeServicesController::class, 'storeGrievance']);
    Route::post('/grievances/{id}/actions', [EmployeeServicesController::class, 'grievanceAction'])->middleware('permission:grievance.manage');
    Route::get('/announcements', [EmployeeServicesController::class, 'announcements']);
    Route::post('/announcements', [EmployeeServicesController::class, 'storeAnnouncement'])->middleware('permission:communication.manage');
    Route::post('/announcements/{id}/read', [EmployeeServicesController::class, 'readAnnouncement']);
    Route::post('/surveys', [EmployeeServicesController::class, 'storeSurvey'])->middleware('permission:communication.manage');
    Route::post('/surveys/{id}/responses', [EmployeeServicesController::class, 'respondSurvey']);
    Route::get('/approvals', [OperationsController::class, 'approvals']);
    Route::patch('/approvals/{approvalRequest}', [OperationsController::class, 'act']);
    Route::get('/notifications', [OperationsController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [OperationsController::class, 'readNotification']);
    Route::get('/exports/{type}', [OperationsController::class, 'export'])->middleware('permission:data.manage');
    Route::post('/imports/employees', [OperationsController::class, 'importEmployees'])->middleware('permission:data.manage');
    Route::get('/imports', [OperationsController::class, 'imports'])->middleware('permission:data.manage');
    Route::middleware('permission:policy.manage')->group(function () {
        Route::get('/organization/overview', [OrganizationController::class, 'overview']);
        Route::post('/companies', [OrganizationController::class, 'storeCompany']);
        Route::put('/companies/{id}', [OrganizationController::class, 'updateCompany']);
        Route::post('/branches', [OrganizationController::class, 'storeBranch']);
        Route::put('/branches/{id}', [OrganizationController::class, 'updateBranch']);
        Route::post('/approval-workflows', [OrganizationController::class, 'storeApprovalWorkflow']);
        Route::post('/integrations', [OrganizationController::class, 'storeIntegration']);
        Route::post('/integration-deliveries/{id}/retry', [OrganizationController::class, 'retryIntegration']);
    });
    Route::get('/self-service/overview', [SelfServiceController::class, 'overview']);

    // Reporting routes
    Route::prefix('reports')->middleware('permission:report.view')->group(function () {
        Route::get('/dashboard-stats', [ReportController::class, 'dashboardStats']);
        Route::get('/employee-stats', [ReportController::class, 'employeeStats']);
        Route::get('/attendance', [ReportController::class, 'attendanceReport']);
        Route::get('/leaves', [ReportController::class, 'leaveReport']);
        Route::get('/payroll', [ReportController::class, 'payrollReport']);
        Route::get('/hrm-overview', [AnalyticsController::class, 'overview']);
    });

    // Task routes
    Route::get('/my-tasks', [TaskController::class, 'myTasks']);
    Route::get('/tasks/stats', [TaskController::class, 'getTaskStats']);
    Route::get('/departments/{departmentId}/employees', [TaskController::class, 'getEmployeesByDepartment']);
    Route::get('/tasks/{task}/download-attachment', [TaskController::class, 'downloadAttachment']);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'storeComment']);
    Route::get('/tasks/attachment/{id}/download', [TaskController::class, 'downloadAttachmentById']);
    Route::get('/task-attachments/{attachmentId}/download', [TaskController::class, 'downloadAttachmentById']);
    Route::apiResource('tasks', TaskController::class)->except(['create', 'edit']);

    Route::prefix('bulk')->middleware('permission:bulk.manage')->group(function () {
        Route::post('/attendance', [BulkOperationController::class, 'bulkAttendance']);
        Route::post('/leave-status', [BulkOperationController::class, 'bulkLeaveStatus']);
        Route::post('/employee-status', [BulkOperationController::class, 'bulkEmployeeStatus']);
        Route::get('/employees-for-attendance', [BulkOperationController::class, 'getEmployeesForBulkAttendance']);
    });

    // Role management
    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:role.view');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:role.manage');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->middleware('permission:role.view');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:role.manage');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:role.manage');
});

// Catch all undefined routes
Route::fallback(function () {
    return response()->json([
        'message' => 'API route not found'
    ], 404);
});
