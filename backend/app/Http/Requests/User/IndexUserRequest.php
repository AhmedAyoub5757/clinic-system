<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role middleware on the route
    }

    public function rules(): array
    {
        return [
            'search'                 => ['nullable', 'string', 'max:100'],
            'role'                   => ['nullable', Rule::exists('roles', 'name')],
            'without_doctor_profile' => ['nullable', 'boolean'],
            'per_page'               => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}