<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LoanInstallment extends Model
{
    protected $guarded = [];
    protected $casts = ['due_date' => 'date', 'paid_at' => 'datetime'];
    public function employeeLoan() { return $this->belongsTo(EmployeeLoan::class); }
}
