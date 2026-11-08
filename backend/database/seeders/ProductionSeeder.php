<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $email    = config('clinic.admin_email');
        $password = config('clinic.admin_password');

        if (! $email || ! $password) {
            $this->command->warn('ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin creation.');
            return;
        }

        // firstOrCreate: later boots never overwrite a password you changed in the app
        $admin = User::firstOrCreate(
            ['email' => $email],
            ['name' => 'System Admin', 'password' => $password]
        );
        $admin->syncRoles('admin');
    }
}