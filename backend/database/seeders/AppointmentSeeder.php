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

        $rows = [
            // [patient, doctor, date, start, end, status]
            [$patients[0], $doctors[0], now()->subDay()->toDateString(), '10:00:00', '10:30:00', 'confirmed'], // past: for testing "complete"
            [$patients[1], $doctors[0], $monday, '09:00:00', '09:30:00', 'confirmed'],
            [$patients[2], $doctors[1], $monday, '09:00:00', '09:30:00', 'pending'],
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