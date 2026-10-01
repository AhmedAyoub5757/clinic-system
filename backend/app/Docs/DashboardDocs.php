<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

class DashboardDocs
{
    #[OA\Get(
        path: '/admin/dashboard',
        summary: 'Clinic statistics',
        description: 'Role: admin only. Cached in Redis for 5 minutes, so numbers can be up to 5 minutes old. Show `generated_at` to the user. `X-Cache` is HIT or MISS.',
        tags: ['Dashboard'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Statistics',
                headers: [new OA\Header(header: 'X-Cache', schema: new OA\Schema(type: 'string', enum: ['HIT', 'MISS']))],
                content: new OA\JsonContent(allOf: [
                    new OA\Schema(ref: '#/components/schemas/SuccessEnvelope'),
                    new OA\Schema(properties: [
                        new OA\Property(property: 'data', type: 'object', properties: [
                            new OA\Property(property: 'patients', type: 'object', properties: [
                                new OA\Property(property: 'total', type: 'integer', example: 50),
                                new OA\Property(property: 'new_this_month', type: 'integer', example: 4),
                            ]),
                            new OA\Property(property: 'doctors', type: 'object', properties: [
                                new OA\Property(property: 'active', type: 'integer', example: 5),
                            ]),
                            new OA\Property(property: 'appointments', type: 'object', properties: [
                                new OA\Property(property: 'today', type: 'integer'),
                                new OA\Property(property: 'upcoming_7_days', type: 'integer', description: 'Pending and confirmed only'),
                                new OA\Property(property: 'by_status', type: 'object', properties: [
                                    new OA\Property(property: 'pending', type: 'integer'),
                                    new OA\Property(property: 'confirmed', type: 'integer'),
                                    new OA\Property(property: 'completed', type: 'integer'),
                                    new OA\Property(property: 'cancelled', type: 'integer'),
                                ]),
                            ]),
                            new OA\Property(property: 'consultations', type: 'object', properties: [
                                new OA\Property(property: 'this_month', type: 'integer'),
                            ]),
                            new OA\Property(property: 'generated_at', type: 'string', example: '2026-10-01 14:05:00'),
                        ]),
                    ]),
                ])
            ),
            new OA\Response(ref: '#/components/responses/Unauthenticated', response: 401),
            new OA\Response(ref: '#/components/responses/Forbidden', response: 403),
        ]
    )]
    public function stats(): void
    {
    }
}