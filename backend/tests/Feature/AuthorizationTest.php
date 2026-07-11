<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled_by_default(): void
    {
        $this->postJson('/api/register', [])->assertForbidden();
    }

    public function test_employee_cannot_access_user_management(): void
    {
        $role = Role::create([
            'name' => 'Employee', 'slug' => 'employee', 'permissions' => [], 'is_active' => true,
        ]);
        $user = User::factory()->create(['role_id' => $role->id, 'is_active' => true]);
        Sanctum::actingAs($user);

        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_admin_wildcard_can_access_user_management(): void
    {
        $role = Role::create([
            'name' => 'Administrator', 'slug' => 'admin', 'permissions' => ['*'], 'is_active' => true,
        ]);
        $user = User::factory()->create(['role_id' => $role->id, 'is_active' => true]);
        Sanctum::actingAs($user);

        $this->getJson('/api/users')->assertOk();
    }

    public function test_inactive_user_is_rejected_by_permission_middleware(): void
    {
        $role = Role::create([
            'name' => 'Administrator', 'slug' => 'admin', 'permissions' => ['*'], 'is_active' => true,
        ]);
        $user = User::factory()->create(['role_id' => $role->id, 'is_active' => false]);
        Sanctum::actingAs($user);

        $this->getJson('/api/users')->assertForbidden();
    }
}
