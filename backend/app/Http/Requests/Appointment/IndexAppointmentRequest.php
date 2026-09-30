<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class IndexAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status'     => ['nullable', 'in:pending,confirmed,completed,cancelled'],
            'doctor_id'  => ['nullable', 'integer'],
            'patient_id' => ['nullable', 'integer'],
            'date'       => ['nullable', 'date_format:Y-m-d'],
            'date_from'  => ['nullable', 'date_format:Y-m-d'],
            'date_to'    => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort'       => ['nullable', 'in:appointment_date,-appointment_date,created_at,-created_at'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
