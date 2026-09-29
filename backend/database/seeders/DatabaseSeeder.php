<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@clinic.test'],
            ['name' => 'System Admin', 'password' => 'password'] // hashed automatically by the model cast
        );
    }
}