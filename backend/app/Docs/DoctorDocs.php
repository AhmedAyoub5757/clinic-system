<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class DoctorDocs
{
    #[OA\Get(
        path: '/doctors',
        summary: 'List doctors (filter, sort, paginate)',
        description: 'Roles: all staff. Only ACTIVE doctors are returned unless `is_active=0`. Cached in Redis for 10 minutes and cleared on any doctor or user change. The `X-Cache` header shows HIT or MISS.',
        tags: ['Doctors'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', description: 'Partial match on doctor name or specialization', schema: new OA\Schema(type: 'string', maxLength: 100)),
            new OA\Parameter(name: 'specialization', in: 'query', description: 'Exact match', schema: new OA\Schema(type: 'string', maxLength: 100)),
            new OA\Parameter(name: 'available_on', in: 'query', description: 'Doctors who work on this weekday. 0 = Sunday ... 6 = Saturday', schema: new OA\Schema(type: 'integer', minimum: 0, maximum: 6)),
            new OA\Parameter(name: 'is_active', in: 'query', description: 'Send 1 or 0. The words true/false are rejected.', schema: new OA\Schema(type: 'integer', enum: [0, 1], default: 1)),
            new OA\Parameter(name: 'sort', in: 'query', description: 'Prefix with - for descending', schema: new OA\Schema(type: 'string', default: '-created_at', enum: ['specialization', '-specialization', 'consultation_fee', '-consultation_fee', 'created_at', '-created_at'])),
            new OA\Parameter(ref: '#/components/parameters/Page'),
            new OA\Parameter(ref: '#/components/parameters/PerPage'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list',
                headers: [new OA\Header(header: 'X-Cache', description: 'HIT or MISS', schema: new OA\Schema(type: 'string', enum: ['HIT', 'MISS']))],
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Doctor')),
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
        path: '/doctors/{id}',
        summary: 'Get one doctor with schedules',
        description: 'Roles: all staff. Returns inactive doctors too.',
        tags: ['Doctors'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'The doctor',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Doctor')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        ]
    )]
    public function show(): void
    {
    }

    #[OA\Post(
        path: '/doctors',
        summary: 'Create a doctor profile',
        description: 'Role: admin only. Create the user (role `doctor`) first, then attach the profile. Profile and schedules are saved together or not at all. There is no DELETE: deactivate with `is_active: false`.',
        tags: ['Doctors'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/DoctorInput'),
                new OA\Schema(required: ['user_id', 'specialization', 'license_number', 'consultation_fee', 'slot_duration', 'schedules']),
            ])
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Profile created',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Doctor')]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function store(): void
    {
    }

    #[OA\Put(
        path: '/doctors/{id}',
        summary: 'Update a doctor profile (partial)',
        description: 'Role: admin only. `user_id` cannot be changed and is ignored. If `schedules` is sent it replaces the whole old set.',
        tags: ['Doctors'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/DoctorInput')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Doctor')]),
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
}