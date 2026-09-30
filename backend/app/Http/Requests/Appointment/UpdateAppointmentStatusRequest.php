<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentStatusRequest extends FormRequest
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
        // patient and doctor can't change: cancel and rebook instead
        return [
            'appointment_date' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:today'],
            'start_time'       => ['sometimes', 'date_format:H:i'],
            'reason'           => ['nullable', 'string', 'max:500'],
        ];
    }
}
