<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'UserInput',
    properties: [
        new OA\Property(property: 'name', type: 'string', maxLength: 255, example: 'Dr. Hina Malik'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'hina@clinic.test'),
        new OA\Property(property: 'password', type: 'string', minLength: 8, example: 'password123'),
        new OA\Property(property: 'role', type: 'string', enum: ['admin', 'doctor', 'receptionist']),
    ]
)]
class UserInputSchema
{
}