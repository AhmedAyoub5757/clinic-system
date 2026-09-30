<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'status'              => $this->status->value,
            'allowed_transitions' => array_map(fn($s) => $s->value, $this->status->allowedTransitions()),
            'appointment_date'    => $this->appointment_date->toDateString(),
            'start_time'          => substr($this->start_time, 0, 5),
            'end_time'            => substr($this->end_time, 0, 5),
            'reason'              => $this->reason,
            'cancellation_reason' => $this->cancellation_reason,
            'patient'             => $this->whenLoaded('patient', fn() => [
                'id'             => $this->patient->id,
                'patient_number' => $this->patient->patient_number,
                'full_name'      => $this->patient->first_name . ' ' . $this->patient->last_name,
                'phone'          => $this->patient->phone,
            ]),
            'doctor'              => $this->whenLoaded('doctor', fn() => [
                'id'             => $this->doctor->id,
                'name'           => $this->doctor->user?->name,
                'specialization' => $this->doctor->specialization,
            ]),
            'created_at'          => $this->created_at?->toDateTimeString(),
        ];
    }
}
