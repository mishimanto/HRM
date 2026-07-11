<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PayrollItem extends Model
{
    protected $guarded = [];
    protected $casts = ['earnings' => 'array', 'deductions' => 'array', 'employer_contributions' => 'array', 'attendance_summary' => 'array', 'calculation_meta' => 'array'];
    public function employee() { return $this->belongsTo(Employee::class); }
    public function run() { return $this->belongsTo(PayrollRun::class, 'payroll_run_id'); }
}
