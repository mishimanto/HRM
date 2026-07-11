<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class ApprovalRequest extends Model{protected $guarded=[];protected $casts=['acted_at'=>'datetime'];public function approvable(){return $this->morphTo();}public function requester(){return $this->belongsTo(User::class,'requested_by');}public function approver(){return $this->belongsTo(User::class,'approver_id');}}
