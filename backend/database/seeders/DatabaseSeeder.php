<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $users = [
            ['System Admin',   'admin@clinic.test',     'admin'],
            ['Dr. Sara Khan',  'doctor@clinic.test',    'doctor'],
            ['Ali Reception',  'reception@clinic.test', 'receptionist'],
        ];

        foreach ($users as [$name, $email, $role]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => 'password']
            );
            $user->syncRoles($role);
        }

        $this->call(PatientSeeder::class);
    }
}