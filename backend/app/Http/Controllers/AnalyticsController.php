<?php
namespace App\Http\Controllers;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;
class AnalyticsController extends Controller{public function overview(Request$r){$d=$r->validate(['start_date'=>'nullable|date','end_date'=>'nullable|date|after_or_equal:start_date']);$start=$d['start_date']??now()->startOfYear()->toDateString();$end=$d['end_date']??today()->toDateString();$active=DB::table('employees as e')->join('users as u','u.id','=','e.user_id')->where('u.is_active',true)->count();$separations=DB::table('offboarding_cases')->whereBetween('last_working_date',[$start,$end])->where('status','completed')->count();$avgHeadcount=max(1,$active+$separations/2);return response()->json([
'headcount'=>$active,'turnover_rate'=>round($separations/$avgHeadcount*100,2),'separations'=>$separations,
'branch_headcount'=>DB::table('branches as b')->leftJoin('employees as e','e.branch_id','=','b.id')->select('b.name',DB::raw('COUNT(e.id) as employees'))->groupBy('b.id','b.name')->get(),
'recruitment_funnel'=>DB::table('job_applications')->select('stage',DB::raw('COUNT(*) as total'))->whereBetween('created_at',[$start,$end.' 23:59:59'])->groupBy('stage')->get(),
'expense_total'=>(float)DB::table('expense_claims')->whereIn('status',['approved','reimbursed'])->whereBetween('expense_date',[$start,$end])->sum('amount'),
'payroll_total'=>(float)DB::table('payroll_items as p')->join('payroll_runs as r','r.id','=','p.payroll_run_id')->whereIn('r.status',['approved','paid'])->whereBetween('r.payment_date',[$start,$end])->sum('p.net_pay'),
'training_completion_rate'=>$this->percentage(DB::table('training_enrollments')->whereBetween('created_at',[$start,$end.' 23:59:59'])->count(),DB::table('training_enrollments')->where('status','completed')->whereBetween('created_at',[$start,$end.' 23:59:59'])->count()),
'documents_expiring'=>DB::table('documents')->whereBetween('expiry_date',[today(),today()->addDays(30)])->count(),
'pending_approvals'=>DB::table('approval_requests')->where('status','pending')->count(),
]);}private function percentage(int$total,int$completed):float{return$total?round($completed/$total*100,2):0;}}
