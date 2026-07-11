<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $guarded = [];
    protected $casts = ['weekly_off_days' => 'array', 'is_night_shift' => 'boolean', 'is_active' => 'boolean'];
}
