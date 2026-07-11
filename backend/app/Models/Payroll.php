<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'pay_period',
        'pay_date',
        'basic_salary',
        'house_allowance',
        'transport_allowance',
        'bonus',
        'overtime_pay',
        'tax_deduction',
        'other_deductions',
        'net_salary',
        'notes',
        'status'
    ];

    protected $casts = [
        'pay_date' => 'date',
        'basic_salary' => 'decimal:2',
        'house_allowance' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'bonus' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'tax_deduction' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function calculateNetSalary()
    {
        $grossSalary = $this->basic_salary + $this->house_allowance + $this->transport_allowance + $this->bonus + $this->overtime_pay;
        $totalDeductions = $this->tax_deduction + $this->other_deductions;
        $this->net_salary = $grossSalary - $totalDeductions;
        $this->save();
    }
}