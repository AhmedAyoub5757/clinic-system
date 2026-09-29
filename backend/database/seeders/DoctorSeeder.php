<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        if (Doctor::count() > 0) {
            return;
        }

        $specializations = ['General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics'];

        // Doctor #1 reuses the doctor@clinic.test account from Step 4
        $users = collect([User::where('email', 'doctor@clinic.test')->firstOrFail()]);

        for ($i = 0; $i < 4; $i++) {
            $user = User::factory()->create();
            $user->assignRole('doctor');
            $users->push($user);
        }

        foreach ($users as $i => $user) {
            $doctor = Doctor::create([
                'user_id'          => $user->id,
                'specialization'   => $specializations[$i],
                'license_number'   => 'PMC-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                'phone'            => '03' . fake()->numerify('#########'),
                'consultation_fee' => 1000 + ($i * 500),
                'slot_duration'    => 30,
            ]);

            // Doctor #3 works Mon/Wed/Fri only; everyone else Mon-Fri
            $days = $i === 2 ? [1, 3, 5] : [1, 2, 3, 4, 5];

            foreach ($days as $day) {
                $doctor->schedules()->create([
                    'day_of_week' => $day,
                    'start_time'  => '09:00',
                    'end_time'    => '17:00',
                ]);
            }
        }
    }
}