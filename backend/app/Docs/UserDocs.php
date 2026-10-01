<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class UserDocs
{
    #[OA\Get(
        path: '/users',
        summary: 'List staff accounts',
        description: 'Role: admin only. Newest first, 15 per page.',
        tags: ['Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', description: 'Partial match on name or email', schema: new OA\Schema(type: 'string', maxLength: 100)),
            new OA\Parameter(name: 'role', in: 'query', schema: new OA\Schema(type: 'string', enum: ['admin', 'doctor', 'receptionist'])),
            new OA\Parameter(name: 'without_doctor_profile', in: 'query', description: 'Send 1 to list only users that have no doctor profile yet. Use with role=doctor when creating a profile.', schema: new OA\Schema(type: 'integer', enum: [0, 1])),
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
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/User')),
                        new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
                    ]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
        ]
    )]
    public function index(): void
    {
    }

    #[OA\Get(
        path: '/users/{id}',
        summary: 'Get one staff account',
        description: 'Role: admin only.',
        tags: ['Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'The user',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]),
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

    #[OA\Post(
        path: '/users',
        summary: 'Create a staff account',
        description: 'Role: admin only. To make a doctor, create the user with role doctor, then create the doctor profile (Doctors section).',
        tags: ['Users'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(allOf: [
                new OA\Schema(ref: '#/components/schemas/UserInput'),
                new OA\Schema(required: ['name', 'email', 'password', 'role']),
            ])
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User created',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]),
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
        path: '/users/{id}',
        summary: 'Update a staff account (partial)',
        description: 'Role: admin only. Send only the fields that changed. Sending role replaces the current role.',
        tags: ['Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/UserInput')
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User updated',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]),
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

    #[OA\Delete(
        path: '/users/{id}',
        summary: 'Delete a staff account',
        description: 'Role: admin only. Revokes all tokens of the user. An admin cannot delete their own account (403). A user with related records cannot be deleted (409).',
        tags: ['Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Deleted',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'User deleted'),
                    new OA\Property(property: 'data', type: 'null', nullable: true),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
            new OA\Response(ref: '#/components/responses/NotFound', response: 404),
            new OA\Response(ref: '#/components/responses/Conflict', response: 409),
        ]
    )]
    public function destroy(): void
    {
    }
}