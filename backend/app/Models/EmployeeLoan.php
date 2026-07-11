<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class EmployeeLoan extends Model
{
    protected $guarded = [];
    protected $casts = ['disbursed_at' => 'date', 'first_deduction_date' => 'date'];
    public function installments() { return $this->hasMany(LoanInstallment::class); }
}
