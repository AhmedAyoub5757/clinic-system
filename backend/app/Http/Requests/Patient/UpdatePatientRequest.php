<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name'              => ['sometimes', 'string', 'max:100'],
            'last_name'               => ['sometimes', 'string', 'max:100'],
            'gender'                  => ['sometimes', 'in:male,female,other'],
            'date_of_birth'           => ['sometimes', 'date', 'before:today'],
            'phone'                   => ['sometimes', 'string', 'max:20'],
            'email'                   => ['nullable', 'email', 'max:255'],
            'national_id'             => ['nullable', 'string', 'max:20', Rule::unique('patients', 'national_id')->ignore($this->route('patient'))],
            'blood_group'             => ['nullable', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address'                 => ['nullable', 'string', 'max:500'],
            'emergency_contact_name'  => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}