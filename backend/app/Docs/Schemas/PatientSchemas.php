<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

// What the API returns (matches PatientResource)
#[OA\Schema(
    schema: 'Patient',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'patient_number', type: 'string', example: 'PT-000001'),
        new OA\Property(property: 'first_name', type: 'string', example: 'Ahmed'),
        new OA\Property(property: 'last_name', type: 'string', example: 'Raza'),
        new OA\Property(property: 'full_name', type: 'string', example: 'Ahmed Raza'),
        new OA\Property(property: 'gender', type: 'string', enum: ['male', 'female', 'other']),
        new OA\Property(property: 'date_of_birth', type: 'string', format: 'date', example: '1990-05-14'),
        new OA\Property(property: 'age', type: 'integer', example: 36),
        new OA\Property(property: 'phone', type: 'string', example: '03001234567'),
        new OA\Property(property: 'email', type: 'string', nullable: true),
        new OA\Property(property: 'national_id', type: 'string', nullable: true, example: '3520212345671'),
        new OA\Property(property: 'blood_group', type: 'string', nullable: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        new OA\Property(property: 'address', type: 'string', nullable: true),
        new OA\Property(property: 'emergency_contact', type: 'object', properties: [
            new OA\Property(property: 'name', type: 'string', nullable: true),
            new OA\Property(property: 'phone', type: 'string', nullable: true),
        ]),
        new OA\Property(property: 'created_at', type: 'string', example: '2026-10-01 09:30:00'),
    ]
)]
// What the API accepts (matches the Form Requests). Note: emergency contact is FLAT here.
#[OA\Schema(
    schema: 'PatientInput',
    properties: [
        new OA\Property(property: 'first_name', type: 'string', maxLength: 100, example: 'Ahmed'),
        new OA\Property(property: 'last_name', type: 'string', maxLength: 100, example: 'Raza'),
        new OA\Property(property: 'gender', type: 'string', enum: ['male', 'female', 'other']),
        new OA\Property(property: 'date_of_birth', type: 'string', format: 'date', description: 'Must be before today', example: '1990-05-14'),
        new OA\Property(property: 'phone', type: 'string', maxLength: 20, example: '03001234567'),
        new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
        new OA\Property(property: 'national_id', type: 'string', maxLength: 20, nullable: true, description: 'Unique across patients'),
        new OA\Property(property: 'blood_group', type: 'string', nullable: true, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        new OA\Property(property: 'address', type: 'string', maxLength: 500, nullable: true),
        new OA\Property(property: 'emergency_contact_name', type: 'string', nullable: true),
        new OA\Property(property: 'emergency_contact_phone', type: 'string', maxLength: 20, nullable: true),
    ]
)]
class PatientSchemas
{
}