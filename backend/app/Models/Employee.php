<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'position_id',
        'salary',
        'employment_type',
        'joining_date',
        'exit_date',
        'emergency_contact',
        'notes'
        ,'company_id','branch_id','gender','marital_status','national_id','tin','taxpayer_category',
        'bank_name','bank_account_name','bank_account_number','bank_routing_number',
        'provident_fund_number','gratuity_number','probation_end_date','confirmation_date','work_location'
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'joining_date' => 'date',
        'exit_date' => 'date',
        'emergency_contact' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function company() { return $this->belongsTo(Company::class); }
    public function branch() { return $this->belongsTo(Branch::class); }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }

    public function getFullNameAttribute()
    {
        return $this->user->name;
    }

    public function getEmailAttribute()
    {
        return $this->user->email;
    }
}
