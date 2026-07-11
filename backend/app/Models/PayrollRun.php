<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class PayrollRun extends Model
{
    protected $guarded = [];
    protected $casts = ['period_start' => 'date', 'period_end' => 'date', 'payment_date' => 'date', 'approved_at' => 'datetime', 'paid_at' => 'datetime'];
    public function items() { return $this->hasMany(PayrollItem::class); }
}
