<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Components(
    parameters: [
        new OA\Parameter(
            parameter: 'Page',
            name: 'page',
            in: 'query',
            description: 'Page number',
            required: false,
            schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)
        ),
        new OA\Parameter(
            parameter: 'PerPage',
            name: 'per_page',
            in: 'query',
            description: 'Items per page (1 to 100)',
            required: false,
            schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 100, default: 15)
        ),
    ]
)]
class SharedParameters
{
}