<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'event', 'route', 'subject_type', 'subject_id', 'ip_address',
        'user_agent', 'request_data', 'response_status', 'created_at',
    ];

    protected $casts = [
        'request_data' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (AuditLog $log) => $log->created_at ??= now());
    }
}
