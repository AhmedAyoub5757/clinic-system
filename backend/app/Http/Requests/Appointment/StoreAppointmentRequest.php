<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role middleware on the route
    }

    public function rules(): array
    {
        return [
            'patient_id'       => ['required', 'integer', Rule::exists('patients', 'id')->whereNull('deleted_at')],
            'doctor_id'        => ['required', 'integer', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time'       => ['required', 'date_format:H:i'],
            'reason'           => ['nullable', 'string', 'max:500'],
        ];
    }
}