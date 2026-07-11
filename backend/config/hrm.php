<?php
return ['allow_public_registration' => env('HRM_ALLOW_PUBLIC_REGISTRATION', false), 'permissions'=>[
 'People'=>['user.manage','employee.view','employee.manage','department.view','department.manage','document.manage'],
 'Time & Leave'=>['attendance.self','attendance.view','attendance.manage','leave.self','leave.view','leave.approve','policy.manage'],
 'Compensation'=>['payroll.self','payroll.view','payroll.manage','payroll.approve','benefit.manage','expense.manage'],
 'Talent'=>['recruitment.manage','lifecycle.manage','performance.manage','training.manage','task.self'],
 'Operations'=>['approval.manage','asset.manage','grievance.manage','communication.manage','report.view','bulk.manage','data.manage','role.view','role.manage'],
]];
