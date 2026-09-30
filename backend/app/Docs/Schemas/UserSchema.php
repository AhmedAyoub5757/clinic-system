<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'name', type: 'string', example: 'System Admin'),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'admin@clinic.test'),
        new OA\Property(property: 'role', type: 'string', enum: ['admin', 'doctor', 'receptionist'], example: 'admin'),
        new OA\Property(property: 'created_at', type: 'string', example: '2026-09-30 10:15:00'),
    ]
)]
class UserSchema
{
}