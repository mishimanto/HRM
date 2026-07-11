<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone',
        'address',
        'date_of_birth',
        'hire_date',
        'employee_id',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'date_of_birth' => 'date',
        'hire_date' => 'date',
        'is_active' => 'boolean'
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function department()
    {
        return $this->hasOne(Department::class, 'manager_id');
    }

    public function hasRole($role): bool
    {
        return $this->role?->slug === $role;
    }

    public function hasPermission($permission): bool
    {
        return $this->role && $this->role->hasPermission($permission);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isHR(): bool
    {
        return $this->hasRole('hr');
    }

    public function isEmployee(): bool
    {
        return $this->hasRole('employee');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }
    public function routeNotificationForMail()
    {
        return $this->email;
    }
}
