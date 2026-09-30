<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class AuthDocs
{
    #[OA\Post(
        path: '/auth/login',
        summary: 'Log in and receive an access token',
        description: 'Limited to 5 attempts per minute per email and IP. Public endpoint.',
        tags: ['Auth'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'admin@clinic.test'),
                    new OA\Property(property: 'password', type: 'string', example: 'password'),
                    new OA\Property(property: 'device_name', type: 'string', nullable: true, example: 'react-app'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login successful',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', type: 'object', properties: [
                            new OA\Property(property: 'token', type: 'string', example: '1|abc123...'),
                            new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                            new OA\Property(property: 'user', ref: '#/components/schemas/User'),
                        ]),
                    ]),
                ])
            ),
            new OA\Response(
                response: 401,
                description: 'Wrong email or password',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: false),
                    new OA\Property(property: 'message', type: 'string', example: 'Invalid credentials'),
                ])
            ),
            new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
            new OA\Response(ref: '#/components/responses/TooManyRequests', response: 429),
        ]
    )]
    public function login(): void
    {
    }

    #[OA\Get(
        path: '/auth/me',
        summary: 'Get the logged-in user',
        tags: ['Auth'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Current user with role',
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                    ]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
        ]
    )]
    public function me(): void
    {
    }

    #[OA\Post(
        path: '/auth/logout',
        summary: 'Log out (revokes the current token only)',
        tags: ['Auth'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Logged out',
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: 'success', type: 'boolean', example: true),
                    new OA\Property(property: 'message', type: 'string', example: 'Logged out successfully'),
                    new OA\Property(property: 'data', type: 'null', nullable: true),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
        ]
    )]
    public function logout(): void
    {
    }
}