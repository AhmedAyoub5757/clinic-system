<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    private const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'user_id'          => $this->user_id,
            'name'             => $this->user?->name,
            'email'            => $this->user?->email,
            'specialization'   => $this->specialization,
            'license_number'   => $this->license_number,
            'phone'            => $this->phone,
            'consultation_fee' => $this->consultation_fee,
            'slot_duration'    => $this->slot_duration,
            'bio'              => $this->bio,
            'is_active'        => $this->is_active,
            'schedules'        => $this->whenLoaded('schedules', fn () => $this->schedules
                ->sortBy('day_of_week')->values()
                ->map(fn ($s) => [
                    'day_of_week' => $s->day_of_week,
                    'day_name'    => self::DAYS[$s->day_of_week],
                    'start_time'  => substr($s->start_time, 0, 5),
                    'end_time'    => substr($s->end_time, 0, 5),
                ])),
        ];
    }
}