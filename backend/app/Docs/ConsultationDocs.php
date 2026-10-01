<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class ConsultationDocs
{
    #[OA\Post(
        path: '/appointments/{id}/consultation',
        summary: 'Record a consultation (completes the appointment)',
        description: "Role: doctor, own appointments only (403 otherwise). The consultation and the status change to `completed` are saved together or not at all. **409** if the appointment is not `confirmed`, was already completed, or its date is in the future. **Validation errors on prescriptions use dotted keys**, e.g. `prescriptions.0.dosage`.",
        tags: ['Consultations'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Appointment id', schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/ConsultationInput'),
                new OA\Schema(required: ['diagnosis']),
            ])
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Recorded',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Consultation')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Get(
        path: '/consultations/{id}',
        summary: 'Get one consultation',
        description: 'Role: doctor (ANY doctor can read, for continuity of care). Admin and receptionist get 403.',
        tags: ['Consultations'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'The consultation',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Consultation')]),
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

    #[OA\Put(
        path: '/consultations/{id}',
        summary: 'Amend a consultation (partial)',
        description: 'Role: doctor, and only the AUTHOR of the record (403 for other doctors). Send only what changed. If `prescriptions` is sent it replaces the whole list.',
        tags: ['Consultations'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/ConsultationInput')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Updated',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Consultation')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function update(): void
    {
    }

    #[OA\Get(
        path: '/patients/{id}/history',
        summary: "A patient's consultation history (all doctors)",
        description: 'Role: doctor only. Newest first. An empty history is a normal 200 with `data: []`. Items do not include the `patient` block.',
        tags: ['Consultations'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, description: 'Patient id', schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(ref: '#/components/parameters/Page'),
            new OA\Parameter(ref: '#/components/parameters/PerPage'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated history',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Consultation')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function history(): void
    {
    }
}