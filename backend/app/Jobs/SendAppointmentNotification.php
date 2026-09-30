<?php

namespace App\Jobs;

use App\Models\Appointment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendAppointmentNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $appointmentId, public string $event)
    {
    }

    public function handle(): void
    {
        $appointment = Appointment::with(['patient', 'doctor.user'])->find($this->appointmentId);

        if (! $appointment) {
            return;
        }

        // Stand-in for a real SMS/email provider
        Log::info(sprintf(
            '[Notification:%s] To %s (%s): appointment with Dr. %s on %s at %s',
            $this->event,
            $appointment->patient->first_name . ' ' . $appointment->patient->last_name,
            $appointment->patient->phone,
            $appointment->doctor->user->name,
            $appointment->appointment_date->toDateString(),
            substr($appointment->start_time, 0, 5)
        ));
    }
}