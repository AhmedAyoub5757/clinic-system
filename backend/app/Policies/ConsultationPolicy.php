<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\User;

class ConsultationPolicy
{
    // Deliberately any doctor: continuity of care
    public function view(User $user, Consultation $consultation): bool
    {
        return $user->hasRole('doctor');
    }

    // Only the author can amend their own record
    public function update(User $user, Consultation $consultation): bool
    {
        return $user->hasRole('doctor') && $consultation->doctor_id === $user->doctor?->id;
    }
}