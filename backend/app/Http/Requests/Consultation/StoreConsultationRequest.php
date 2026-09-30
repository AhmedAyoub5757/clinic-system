<?php

namespace App\Http\Requests\Consultation;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role middleware + policy
    }

    public function rules(): array
    {
        return [
            'symptoms'       => ['nullable', 'string', 'max:2000'],
            'diagnosis'      => ['required', 'string', 'max:2000'],
            'notes'          => ['nullable', 'string', 'max:5000'],
            'follow_up_date' => ['nullable', 'date_format:Y-m-d', 'after:today'],

            'prescriptions'                 => ['nullable', 'array', 'max:20'],
            'prescriptions.*.medicine_name' => ['required', 'string', 'max:150'],
            'prescriptions.*.dosage'        => ['required', 'string', 'max:50'],
            'prescriptions.*.frequency'     => ['required', 'string', 'max:100'],
            'prescriptions.*.duration_days' => ['required', 'integer', 'between:1,365'],
            'prescriptions.*.instructions'  => ['nullable', 'string', 'max:255'],
        ];
    }
}