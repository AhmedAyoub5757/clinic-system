<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsultationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'appointment_id' => $this->appointment_id,
            'symptoms'       => $this->symptoms,
            'diagnosis'      => $this->diagnosis,
            'notes'          => $this->notes,
            'follow_up_date' => $this->follow_up_date?->toDateString(),
            'prescriptions'  => $this->whenLoaded('items', fn() => $this->items->map(fn($i) => [
                'id'            => $i->id,
                'medicine_name' => $i->medicine_name,
                'dosage'        => $i->dosage,
                'frequency'     => $i->frequency,
                'duration_days' => $i->duration_days,
                'instructions'  => $i->instructions,
            ])),
            'appointment'    => $this->whenLoaded('appointment', fn() => [
                'date'       => $this->appointment->appointment_date->toDateString(),
                'start_time' => substr($this->appointment->start_time, 0, 5),
            ]),
            'patient'        => $this->whenLoaded('patient', fn() => [
                'id'             => $this->patient->id,
                'patient_number' => $this->patient->patient_number,
                'full_name'      => $this->patient->first_name . ' ' . $this->patient->last_name,
            ]),
            'doctor'         => $this->whenLoaded('doctor', fn() => [
                'id'             => $this->doctor->id,
                'name'           => $this->doctor->user?->name,
                'specialization' => $this->doctor->specialization,
            ]),
            'created_at'     => $this->created_at?->toDateTimeString(),
            'updated_at'     => $this->updated_at?->toDateTimeString(),
        ];
    }
}
