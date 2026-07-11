<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class ExpenseClaim extends Model{protected $guarded=[];protected $casts=['expense_date'=>'date','reimbursed_at'=>'datetime'];public function approvals(){return$this->morphMany(ApprovalRequest::class,'approvable');}}
