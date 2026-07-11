<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    protected $guarded = [];
    protected $casts = [
        'annual_entitlement' => 'decimal:2', 'accrual_amount' => 'decimal:2', 'worked_days_divisor' => 'decimal:2',
        'max_carry_forward' => 'decimal:2', 'max_balance' => 'decimal:2',
        'is_paid' => 'boolean', 'requires_document' => 'boolean',
        'is_encashable' => 'boolean', 'gender_specific' => 'boolean', 'is_active' => 'boolean',
    ];
}
