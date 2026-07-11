<?php
namespace App\Http\Controllers;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;
class SelfServiceController extends Controller{public function overview(Request$r){$employee=$r->user()->employee;abort_unless($employee,404,'Employee record not found');$id=$employee->id;return response()->json([
'profile'=>$employee->load(['user.role','department','position','company','branch']),
'today_attendance'=>DB::table('attendances')->where('employee_id',$id)->whereDate('date',today())->first(),
'attendance'=>DB::table('attendances')->where('employee_id',$id)->orderByDesc('date')->limit(10)->get(),
'leave_balances'=>DB::table('leave_balances as b')->join('leave_types as t','t.id','=','b.leave_type_id')->where('b.employee_id',$id)->where('b.year',now()->year)->select('b.*','t.name','t.code')->get()->map(function($b){$b->available=(float)$b->opening_balance+(float)$b->accrued+(float)$b->adjusted-(float)$b->used-(float)$b->encashed;return$b;}),
'leaves'=>DB::table('leaves')->where('employee_id',$id)->orderByDesc('id')->limit(10)->get(),
'payslips'=>DB::table('payroll_items as p')->join('payroll_runs as r','r.id','=','p.payroll_run_id')->where('p.employee_id',$id)->whereIn('r.status',['approved','paid'])->select('p.*','r.name as run_name','r.payment_date','r.status as run_status')->orderByDesc('r.payment_date')->limit(12)->get(),
'expenses'=>DB::table('expense_claims')->where('employee_id',$id)->orderByDesc('id')->limit(10)->get(),
'documents'=>DB::table('documents')->where('employee_id',$id)->orderByDesc('id')->limit(20)->get(),
'tasks'=>DB::table('tasks')->where('assigned_to',$id)->whereNotIn('status',['completed','cancelled'])->orderBy('due_date')->limit(10)->get(),
'training'=>DB::table('training_enrollments as e')->join('training_courses as c','c.id','=','e.training_course_id')->where('e.employee_id',$id)->select('e.*','c.title','c.duration_hours')->orderByDesc('e.id')->limit(20)->get(),
'assets'=>DB::table('asset_assignments as aa')->join('assets as a','a.id','=','aa.asset_id')->where('aa.employee_id',$id)->whereNull('aa.returned_at')->select('aa.*','a.name','a.asset_tag','a.category')->get(),
'announcements'=>DB::table('announcements')->where(fn($q)=>$q->whereNull('published_at')->orWhere('published_at','<=',now()))->where(fn($q)=>$q->whereNull('expires_at')->orWhere('expires_at','>',now()))->orderByDesc('id')->limit(10)->get(),
'surveys'=>DB::table('surveys')->where('status','active')->where('opens_at','<=',now())->where('closes_at','>=',now())->get()->map(function($s){$s->questions=DB::table('survey_questions')->where('survey_id',$s->id)->orderBy('sequence')->get();return$s;}),
]);}}
