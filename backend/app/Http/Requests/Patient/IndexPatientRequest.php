<?php

namespace App\Http\Requests\Patient;

use Illuminate\Foundation\Http\FormRequest;

class IndexPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search'      => ['nullable', 'string', 'max:100'],
            'gender'      => ['nullable', 'in:male,female,other'],
            'blood_group' => ['nullable', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'sort'        => ['nullable', 'in:created_at,-created_at,last_name,-last_name,date_of_birth,-date_of_birth'],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}