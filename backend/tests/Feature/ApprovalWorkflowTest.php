<?php
namespace Tests\Feature;
use App\Models\Employee;use App\Models\Role;use App\Models\User;use Illuminate\Foundation\Testing\RefreshDatabase;use Illuminate\Support\Facades\DB;use Laravel\Sanctum\Sanctum;use Tests\TestCase;
class ApprovalWorkflowTest extends TestCase{
 use RefreshDatabase;
 public function test_expense_submission_and_approval_stay_in_sync():void{
  [$employeeUser,$employee]=$this->userWithEmployee('employee',[]);Sanctum::actingAs($employeeUser);
  $response=$this->postJson('/api/expenses',['category'=>'Travel','expense_date'=>now()->toDateString(),'amount'=>1250,'description'=>'Client visit'])->assertCreated();
  $this->assertDatabaseHas('approval_requests',['approvable_type'=>'App\\Models\\ExpenseClaim','approvable_id'=>$response->json('id'),'status'=>'pending']);
  $approvalId=DB::table('approval_requests')->value('id');
  [$hr]=$this->userWithEmployee('hr',['approval.manage','expense.manage']);Sanctum::actingAs($hr);
  $this->patchJson("/api/approvals/{$approvalId}",['status'=>'approved'])->assertOk();
  $this->assertDatabaseHas('expense_claims',['id'=>$response->json('id'),'status'=>'approved','approved_by'=>$hr->id]);
 }
 public function test_employee_cannot_submit_leave_for_another_employee():void{
  [$user,$own]=$this->userWithEmployee('employee',[]);[, $other]=$this->userWithEmployee('other',[]);Sanctum::actingAs($user);
  $this->postJson('/api/leaves',['employee_id'=>$other->id,'leave_type'=>'casual','start_date'=>now()->addDay()->toDateString(),'end_date'=>now()->addDays(2)->toDateString(),'reason'=>'Personal'])->assertCreated();
  $this->assertDatabaseHas('leaves',['employee_id'=>$own->id,'leave_type'=>'casual']);$this->assertDatabaseMissing('leaves',['employee_id'=>$other->id]);
 }
 private function userWithEmployee(string$slug,array$permissions):array{$role=Role::create(['name'=>ucfirst($slug).uniqid(),'slug'=>$slug.uniqid(),'permissions'=>$permissions,'is_active'=>true]);$user=User::factory()->create(['role_id'=>$role->id,'is_active'=>true]);$employee=Employee::create(['user_id'=>$user->id,'joining_date'=>now(),'employment_type'=>'full-time','salary'=>0]);return[$user,$employee];}
}
