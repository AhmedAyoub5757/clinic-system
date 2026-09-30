<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        if (Appointment::count() > 0) {
            return;
        }

        $receptionist = User::where('email', 'reception@clinic.test')->firstOrFail();
        $patients     = Patient::orderBy('id')->take(3)->get();
        $doctors      = Doctor::orderBy('id')->take(2)->get();
        $monday       = now()->next(Carbon::MONDAY)->toDateString();

        $monday     = now()->next(Carbon::MONDAY)->toDateString();
        $yesterday  = now()->subDay()->toDateString();
        $twoDaysAgo = now()->subDays(2)->toDateString();

        $rows = [
            // [patient, doctor, date, start, end, status]
            [$patients[0], $doctors[0], $yesterday,  '10:00:00', '10:30:00', 'confirmed'], // 1: past, confirmed, doctor 1
            [$patients[1], $doctors[0], $monday,     '09:00:00', '09:30:00', 'confirmed'], // 2: future, confirmed
            [$patients[2], $doctors[1], $monday,     '09:00:00', '09:30:00', 'pending'],   // 3: future, pending
            [$patients[0], $doctors[0], $twoDaysAgo, '10:00:00', '10:30:00', 'confirmed'], // 4: same patient as 1, for history
            [$patients[1], $doctors[1], $yesterday,  '10:00:00', '10:30:00', 'confirmed'], // 5: past, confirmed, doctor 2
            [$patients[2], $doctors[0], $yesterday,  '11:00:00', '11:30:00', 'pending'],   // 6: past but still pending
        ];

        foreach ($rows as [$patient, $doctor, $date, $start, $end, $status]) {
            Appointment::create([
                'patient_id'       => $patient->id,
                'doctor_id'        => $doctor->id,
                'created_by'       => $receptionist->id,
                'appointment_date' => $date,
                'start_time'       => $start,
                'end_time'         => $end,
                'status'           => $status,
                'reason'           => 'Seeded appointment',
            ]);
        }
    }
}
