<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

// Output: includes day_name
#[OA\Schema(
    schema: 'Schedule',
    properties: [
        new OA\Property(property: 'day_of_week', type: 'integer', minimum: 0, maximum: 6, description: '0 = Sunday ... 6 = Saturday', example: 1),
        new OA\Property(property: 'day_name', type: 'string', example: 'Monday'),
        new OA\Property(property: 'start_time', type: 'string', example: '09:00'),
        new OA\Property(property: 'end_time', type: 'string', example: '17:00'),
    ]
)]
// Input: no day_name
#[OA\Schema(
    schema: 'ScheduleInput',
    required: ['day_of_week', 'start_time', 'end_time'],
    properties: [
        new OA\Property(property: 'day_of_week', type: 'integer', minimum: 0, maximum: 6, example: 1),
        new OA\Property(property: 'start_time', type: 'string', description: 'H:i format', example: '09:00'),
        new OA\Property(property: 'end_time', type: 'string', description: 'H:i format, must be after start_time', example: '17:00'),
    ]
)]
#[OA\Schema(
    schema: 'Doctor',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'user_id', type: 'integer', example: 2),
        new OA\Property(property: 'name', type: 'string', example: 'Dr. Sara Khan'),
        new OA\Property(property: 'email', type: 'string', example: 'doctor@clinic.test'),
        new OA\Property(property: 'specialization', type: 'string', example: 'General Medicine'),
        new OA\Property(property: 'license_number', type: 'string', example: 'PMC-00001'),
        new OA\Property(property: 'phone', type: 'string', nullable: true),
        new OA\Property(property: 'consultation_fee', type: 'string', description: 'Decimal returned as a STRING', example: '1000.00'),
        new OA\Property(property: 'slot_duration', type: 'integer', description: 'Minutes per appointment', example: 30),
        new OA\Property(property: 'bio', type: 'string', nullable: true),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
        new OA\Property(property: 'schedules', type: 'array', items: new OA\Items(ref: '#/components/schemas/Schedule')),
    ]
)]
#[OA\Schema(
    schema: 'DoctorInput',
    properties: [
        new OA\Property(property: 'user_id', type: 'integer', description: 'Create only. The user must have the doctor role and no profile yet.', example: 7),
        new OA\Property(property: 'specialization', type: 'string', maxLength: 100, example: 'Neurology'),
        new OA\Property(property: 'license_number', type: 'string', maxLength: 50, description: 'Unique', example: 'PMC-90001'),
        new OA\Property(property: 'phone', type: 'string', maxLength: 20, nullable: true),
        new OA\Property(property: 'consultation_fee', type: 'number', minimum: 0, maximum: 1000000, example: 2500),
        new OA\Property(property: 'slot_duration', type: 'integer', minimum: 10, maximum: 120, example: 30),
        new OA\Property(property: 'bio', type: 'string', maxLength: 1000, nullable: true),
        new OA\Property(property: 'is_active', type: 'boolean'),
        new OA\Property(property: 'schedules', type: 'array', minItems: 1, maxItems: 7, description: 'One entry per working day, no repeated days. On update, a sent list REPLACES the old one.', items: new OA\Items(ref: '#/components/schemas/ScheduleInput')),
    ]
)]
class DoctorSchemas
{
}