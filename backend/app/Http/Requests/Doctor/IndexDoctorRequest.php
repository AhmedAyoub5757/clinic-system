<?php

namespace App\Http\Requests\Doctor;

use Illuminate\Foundation\Http\FormRequest;

class IndexDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search'         => ['nullable', 'string', 'max:100'],
            'specialization' => ['nullable', 'string', 'max:100'],
            'available_on'   => ['nullable', 'integer', 'between:0,6'],
            'is_active'      => ['nullable', 'boolean'],
            'sort'           => ['nullable', 'in:specialization,-specialization,consultation_fee,-consultation_fee,created_at,-created_at'],
            'per_page'       => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}