<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->hasRole('doctor')) {
            return $appointment->doctor_id === $user->doctor?->id;
        }

        return $user->hasAnyRole(['admin', 'receptionist']);
    }

    public function complete(User $user, Appointment $appointment): bool
    {
        return $user->hasRole('doctor') && $appointment->doctor_id === $user->doctor?->id;
    }
} 