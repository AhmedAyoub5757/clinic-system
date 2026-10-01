<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class AppointmentDocs
{
    #[OA\Get(
        path: '/appointments',
        summary: 'List appointments (filter, sort, paginate)',
        description: 'Roles: admin, doctor, receptionist. DOCTORS only ever receive their own appointments, whatever filters they send.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'status', in: 'query', schema: new OA\Schema(type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'])),
            new OA\Parameter(name: 'doctor_id', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'patient_id', in: 'query', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'date', in: 'query', description: 'Exact day', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_from', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'date_to', in: 'query', description: 'Must be on or after date_from', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'sort', in: 'query', description: 'Prefix with - for descending. Ties are broken by start_time.', schema: new OA\Schema(type: 'string', default: 'appointment_date', enum: ['appointment_date', '-appointment_date', 'created_at', '-created_at'])),
            new OA\Parameter(ref: '#/components/parameters/Page'),
            new OA\Parameter(ref: '#/components/parameters/PerPage'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Appointment')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
            new OA\Response(ref: '#/components/responses/TooManyRequests', response: 429),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Get(
        path: '/appointments/{id}',
        summary: 'Get one appointment',
        description: 'Roles: admin, receptionist, and the doctor it belongs to. Another doctor gets 403.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'The appointment',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Appointment')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Get(
        path: '/doctors/{id}/availability',
        summary: 'Free slots for a doctor on a date',
        description: 'Roles: all staff. Use this to build the booking screen: the returned `start` value is what you send as `start_time` when booking. Slots already in the past (when the date is today) are not returned.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Doctor id', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'date', in: 'query', required: true, description: 'Y-m-d, today or later', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Free slots (the list may be empty)',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Availability')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function availability(): void
    {
    }

    #[OA\Post(
        path: '/appointments',
        summary: 'Book an appointment',
        description: "Role: receptionist only. New appointments start as `pending`.\n\n**422** means the request itself breaks a rule: doctor inactive, time in the past, doctor does not work that day, outside working hours, or time not aligned to the doctor's slots. **409** means the request is valid but the calendar changed: the doctor's slot is taken, or the patient already has an appointment at that time. A 409 usually means someone else booked first, so reload availability.",
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/AppointmentBookInput')),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Booked',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Appointment')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Put(
        path: '/appointments/{id}',
        summary: 'Reschedule or edit the reason',
        description: 'Role: receptionist only. Only pending or confirmed appointments can be edited (409 otherwise). The appointment does not conflict with itself.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/AppointmentUpdateInput')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Updated',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Appointment')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function update(): void
    {
    }

    #[OA\Post(
        path: '/appointments/{id}/confirm',
        summary: 'Confirm a pending appointment',
        description: 'Role: receptionist only. Allowed only from `pending` (409 otherwise). No request body.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Confirmed. Returns the updated appointment.',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Appointment')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
        ]
    )]
    public function confirm(): void
    {
    }

    #[OA\Post(
        path: '/appointments/{id}/cancel',
        summary: 'Cancel an appointment',
        description: 'Role: receptionist only. Allowed from `pending` or `confirmed`. Cancelling frees the slot.',
        tags: ['Appointments'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['cancellation_reason'],
                properties: [new OA\Property(property: 'cancellation_reason', type: 'string', maxLength: 500, example: 'Patient requested')]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Cancelled. Returns the updated appointment.',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Appointment')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function cancel(): void
    {
    }
}