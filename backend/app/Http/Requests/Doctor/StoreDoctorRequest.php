<?php

namespace App\Http\Requests\Doctor;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // enforced by role middleware
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'integer', 'exists:users,id', 'unique:doctors,user_id',
                function ($attribute, $value, $fail) {
                    if (! User::find($value)?->hasRole('doctor')) {
                        $fail('The selected user must have the doctor role.');
                    }
                },
            ],
            'specialization'   => ['required', 'string', 'max:100'],
            'license_number'   => ['required', 'string', 'max:50', 'unique:doctors,license_number'],
            'phone'            => ['nullable', 'string', 'max:20'],
            'consultation_fee' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'slot_duration'    => ['required', 'integer', 'min:10', 'max:120'],
            'bio'              => ['nullable', 'string', 'max:1000'],
            'is_active'        => ['sometimes', 'boolean'],

            'schedules'                   => ['required', 'array', 'min:1', 'max:7'],
            'schedules.*.day_of_week'     => ['required', 'integer', 'between:0,6', 'distinct'],
            'schedules.*.start_time'      => ['required', 'date_format:H:i'],
            'schedules.*.end_time'        => ['required', 'date_format:H:i', 'after:schedules.*.start_time'],
        ];
    }
}