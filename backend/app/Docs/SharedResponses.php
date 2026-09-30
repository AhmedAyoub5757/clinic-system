<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Response(
    response: 'Unauthenticated',
    description: 'Missing, invalid, expired or revoked token',
    content: new OA\JsonContent(properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'Unauthenticated'),
    ])
)]
#[OA\Response(
    response: 'Forbidden',
    description: 'Logged in, but the role or record ownership does not allow this',
    content: new OA\JsonContent(properties: [
        new OA\Property(property: 'success', type: 'boolean', example: false),
        new OA\Property(property: 'message', type: 'string', example: 'You do not have the required role'),
    ])
)]
#[OA\Response(
    response: 'NotFound',
    description: 'The record does not exist (message names the resource, e.g. "Patient not found")',
    content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
)]
#[OA\Response(
    response: 'Conflict',
    description: 'The request is valid but conflicts with current state (slot taken, illegal status change)',
    content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
)]
#[OA\Response(
    response: 'ValidationError',
    description: 'Validation failed. "errors" maps each field to its messages.',
    content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')
)]
#[OA\Response(
    response: 'TooManyRequests',
    description: 'Rate limit hit. Read the Retry-After header for seconds to wait.',
    headers: [
        new OA\Header(header: 'Retry-After', description: 'Seconds until the limit resets', schema: new OA\Schema(type: 'integer')),
    ],
    content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
)]
class SharedResponses
{
}