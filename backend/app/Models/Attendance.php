<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'total_hours',
        'status',
        'notes',
        'shift_id',
        'worked_minutes',
        'late_minutes',
        'overtime_minutes',
        'is_manual',
        'approved_by'
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'check_in' => 'datetime:H:i:s',
        'check_out' => 'datetime:H:i:s',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    // Accessor for formatted check_in time
    public function getCheckInFormattedAttribute()
    {
        return $this->check_in ? Carbon::parse($this->check_in)->format('h:i A') : null;
    }

    // Accessor for formatted check_out time
    public function getCheckOutFormattedAttribute()
    {
        return $this->check_out ? Carbon::parse($this->check_out)->format('h:i A') : null;
    }

    public function calculateTotalHours()
{
    if ($this->check_in && $this->check_out) {
        // ✅ FIXED: Combine date with time
        $checkIn = Carbon::parse($this->date . ' ' . $this->check_in);
        $checkOut = Carbon::parse($this->date . ' ' . $this->check_out);
        $totalHours = $checkOut->diffInMinutes($checkIn) / 60;
        
        $this->update([
            'total_hours' => round($totalHours, 2)
        ]);
    }
}
}
