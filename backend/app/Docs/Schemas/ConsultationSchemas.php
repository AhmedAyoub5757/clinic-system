<?php

namespace App\Docs\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'PrescriptionItem',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 12),
        new OA\Property(property: 'medicine_name', type: 'string', example: 'Paracetamol'),
        new OA\Property(property: 'dosage', type: 'string', example: '500mg'),
        new OA\Property(property: 'frequency', type: 'string', example: '3 times a day'),
        new OA\Property(property: 'duration_days', type: 'integer', example: 5),
        new OA\Property(property: 'instructions', type: 'string', nullable: true, example: 'After meals'),
    ]
)]
#[OA\Schema(
    schema: 'PrescriptionInput',
    required: ['medicine_name', 'dosage', 'frequency', 'duration_days'],
    properties: [
        new OA\Property(property: 'medicine_name', type: 'string', maxLength: 150),
        new OA\Property(property: 'dosage', type: 'string', maxLength: 50, example: '500mg'),
        new OA\Property(property: 'frequency', type: 'string', maxLength: 100, example: '3 times a day'),
        new OA\Property(property: 'duration_days', type: 'integer', minimum: 1, maximum: 365),
        new OA\Property(property: 'instructions', type: 'string', maxLength: 255, nullable: true),
    ]
)]
#[OA\Schema(
    schema: 'Consultation',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'appointment_id', type: 'integer', example: 1),
        new OA\Property(property: 'symptoms', type: 'string', nullable: true),
        new OA\Property(property: 'diagnosis', type: 'string', example: 'Viral fever'),
        new OA\Property(property: 'notes', type: 'string', nullable: true),
        new OA\Property(property: 'follow_up_date', type: 'string', format: 'date', nullable: true),
        new OA\Property(property: 'prescriptions', type: 'array', items: new OA\Items(ref: '#/components/schemas/PrescriptionItem')),
        new OA\Property(property: 'appointment', type: 'object', properties: [
            new OA\Property(property: 'date', type: 'string', format: 'date'),
            new OA\Property(property: 'start_time', type: 'string', example: '10:00'),
        ]),
        new OA\Property(property: 'patient', type: 'object', description: 'ABSENT in the patient history list (the patient is already known there)', properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'patient_number', type: 'string'),
            new OA\Property(property: 'full_name', type: 'string'),
        ]),
        new OA\Property(property: 'doctor', type: 'object', properties: [
            new OA\Property(property: 'id', type: 'integer'),
            new OA\Property(property: 'name', type: 'string'),
            new OA\Property(property: 'specialization', type: 'string'),
        ]),
        new OA\Property(property: 'created_at', type: 'string'),
        new OA\Property(property: 'updated_at', type: 'string'),
    ]
)]
#[OA\Schema(
    schema: 'ConsultationInput',
    properties: [
        new OA\Property(property: 'symptoms', type: 'string', maxLength: 2000, nullable: true),
        new OA\Property(property: 'diagnosis', type: 'string', maxLength: 2000, description: 'Required on create. On update it can be changed but never blanked.'),
        new OA\Property(property: 'notes', type: 'string', maxLength: 5000, nullable: true),
        new OA\Property(property: 'follow_up_date', type: 'string', format: 'date', nullable: true, description: 'Y-m-d, strictly AFTER today'),
        new OA\Property(property: 'prescriptions', type: 'array', maxItems: 20, description: 'On update, a sent list REPLACES the old one. An empty array clears it.', items: new OA\Items(ref: '#/components/schemas/PrescriptionInput')),
    ]
)]
class ConsultationSchemas
{
}