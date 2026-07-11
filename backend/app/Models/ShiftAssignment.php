<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftAssignment extends Model
{
    protected $guarded = [];
    protected $casts = ['effective_from' => 'date', 'effective_to' => 'date'];
    public function shift() { return $this->belongsTo(Shift::class); }
    public function employee() { return $this->belongsTo(Employee::class); }
}
