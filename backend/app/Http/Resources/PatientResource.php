<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
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
            'patient_number' => $this->patient_number,
            'first_name'     => $this->first_name,
            'last_name'      => $this->last_name,
            'full_name'      => $this->first_name . ' ' . $this->last_name,
            'gender'         => $this->gender,
            'date_of_birth'  => $this->date_of_birth->toDateString(),
            'age'            => $this->date_of_birth->age,
            'phone'          => $this->phone,
            'email'          => $this->email,
            'national_id'    => $this->national_id,
            'blood_group'    => $this->blood_group,
            'address'        => $this->address,
            'emergency_contact' => [
                'name'  => $this->emergency_contact_name,
                'phone' => $this->emergency_contact_phone,
            ],
            'created_at'     => $this->created_at?->toDateTimeString(),
        ];
    }
}
