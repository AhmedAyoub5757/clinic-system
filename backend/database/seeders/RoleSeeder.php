<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Spatie caches roles/permissions (in Redis for us). Clear it when seeding.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['admin', 'doctor', 'receptionist'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }
}