<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // enforced by role middleware on the route
    }

    public function rules(): array
    {
        return [
            'first_name'              => ['required', 'string', 'max:100'],
            'last_name'               => ['required', 'string', 'max:100'],
            'gender'                  => ['required', 'in:male,female,other'],
            'date_of_birth'           => ['required', 'date', 'before:today'],
            'phone'                   => ['required', 'string', 'max:20'],
            'email'                   => ['nullable', 'email', 'max:255'],
            'national_id'             => ['nullable', 'string', 'max:20', 'unique:patients,national_id'],
            'blood_group'             => ['nullable', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address'                 => ['nullable', 'string', 'max:500'],
            'emergency_contact_name'  => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}