<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class Branch extends Model{protected $guarded=[];protected $casts=['is_head_office'=>'boolean','is_active'=>'boolean'];}
