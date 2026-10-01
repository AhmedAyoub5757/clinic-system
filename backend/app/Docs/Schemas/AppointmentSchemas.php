<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Appointment',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 3),
        new OA\Property(property: 'status', type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled']),
        new OA\Property(
            property: 'allowed_transitions',
            type: 'array',
            description: 'Statuses this appointment may move to, based on its CURRENT STATE only. It does not consider the caller\'s role.',
            items: new OA\Items(type: 'string', enum: ['confirmed', 'completed', 'cancelled'])
        ),
        new OA\Property(property: 'appointment_date', type: 'string', format: 'date', example: '2026-10-05'),
        new OA\Property(property: 'start_time', type: 'string', example: '09:00'),
        new OA\Property(property: 'end_time', type: 'string', example: '09:30'),
        new OA\Property(property: 'reason', type: 'string', nullable: true),
        new OA\Property(property: 'cancellation_reason', type: 'string', nullable: true),
        new OA\Property(property: 'patient', type: 'object', properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'patient_number', type: 'string', example: 'PT-000003'),
            new OA\Property(property: 'full_name', type: 'string'),
            new OA\Property(property: 'phone', type: 'string'),
        ]),
        new OA\Property(property: 'doctor', type: 'object', properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'name', type: 'string'),
            new OA\Property(property: 'specialization', type: 'string'),
        ]),
        new OA\Property(property: 'created_at', type: 'string', example: '2026-10-01 11:00:00'),
        new OA\Property(property: 'consultation_id', type: 'integer', nullable: true, description: 'Set once a consultation has been recorded for this appointment'),
    ]
)]
#[OA\Schema(
    schema: 'AppointmentBookInput',
    required: ['patient_id', 'doctor_id', 'appointment_date', 'start_time'],
    properties: [
        new OA\Property(property: 'patient_id', type: 'integer', description: 'Must exist and not be deleted', example: 4),
        new OA\Property(property: 'doctor_id', type: 'integer', example: 1),
        new OA\Property(property: 'appointment_date', type: 'string', format: 'date', description: 'Y-m-d, today or later', example: '2026-10-05'),
        new OA\Property(property: 'start_time', type: 'string', description: 'H:i. Must be one of the doctor\'s slot starts (see availability).', example: '10:00'),
        new OA\Property(property: 'reason', type: 'string', maxLength: 500, nullable: true),
    ]
)]
#[OA\Schema(
    schema: 'AppointmentUpdateInput',
    description: 'Patient and doctor cannot be changed. Cancel and rebook instead.',
    properties: [
        new OA\Property(property: 'appointment_date', type: 'string', format: 'date'),
        new OA\Property(property: 'start_time', type: 'string', example: '11:00'),
        new OA\Property(property: 'reason', type: 'string', maxLength: 500, nullable: true),
    ]
)]
#[OA\Schema(
    schema: 'Availability',
    properties: [
        new OA\Property(property: 'doctor_id', type: 'integer'),
        new OA\Property(property: 'date', type: 'string', format: 'date'),
        new OA\Property(property: 'day', type: 'string', example: 'Monday'),
        new OA\Property(property: 'slot_duration', type: 'integer', example: 30),
        new OA\Property(property: 'slots', type: 'array', description: 'Free slots only. Empty if the doctor does not work that day, is inactive, or is fully booked.', items: new OA\Items(properties: [
            new OA\Property(property: 'start', type: 'string', example: '09:30'),
            new OA\Property(property: 'end', type: 'string', example: '10:00'),
        ], type: 'object')),
    ]
)]
class AppointmentSchemas
{
    
}