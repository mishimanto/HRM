<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'title',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'document_type',
        'description',
        'expiry_date',
        'is_verified',
        'uploaded_by','verified_by','verified_at','storage_disk'
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getFileUrlAttribute()
    {
        return asset('storage/' . $this->file_path);
    }

    public function getFileSizeInKbAttribute()
    {
        return round($this->file_size / 1024, 2);
    }
}
