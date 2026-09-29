<?php

namespace App\Http\Requests\Doctor;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // user_id is deliberately absent: a profile can't be moved to another user
            'specialization'   => ['sometimes', 'string', 'max:100'],
            'license_number'   => ['sometimes', 'string', 'max:50', Rule::unique('doctors', 'license_number')->ignore($this->route('doctor'))],
            'phone'            => ['nullable', 'string', 'max:20'],
            'consultation_fee' => ['sometimes', 'numeric', 'min:0', 'max:1000000'],
            'slot_duration'    => ['sometimes', 'integer', 'min:10', 'max:120'],
            'bio'              => ['nullable', 'string', 'max:1000'],
            'is_active'        => ['sometimes', 'boolean'],

            'schedules'               => ['sometimes', 'array', 'min:1', 'max:7'],
            'schedules.*.day_of_week' => ['required_with:schedules', 'integer', 'between:0,6', 'distinct'],
            'schedules.*.start_time'  => ['required_with:schedules', 'date_format:H:i'],
            'schedules.*.end_time'    => ['required_with:schedules', 'date_format:H:i', 'after:schedules.*.start_time'],
        ];
    }
}