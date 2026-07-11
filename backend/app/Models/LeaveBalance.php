<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveBalance extends Model
{
    protected $guarded = [];
    protected $appends = ['available'];

    public function getAvailableAttribute(): float
    {
        return (float) $this->opening_balance + (float) $this->accrued + (float) $this->adjusted
            - (float) $this->used - (float) $this->encashed;
    }

    public function leaveType() { return $this->belongsTo(LeaveType::class); }
}
