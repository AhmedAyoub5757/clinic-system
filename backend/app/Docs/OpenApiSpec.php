<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

defined('L5_SWAGGER_CONST_HOST') || define('L5_SWAGGER_CONST_HOST', env('L5_SWAGGER_CONST_HOST', 'http://localhost'));

#[OA\Info(
    version: '1.0.0',
    title: 'Clinic API',
    description: 'REST API for the clinic management system. All responses use the envelope { success, message, data }. Errors use { success: false, message, errors? }.'
)]
#[OA\Server(url: L5_SWAGGER_CONST_HOST, description: 'Local')]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    description: 'Token returned by POST /auth/login. Expires after 8 hours.'
)]
#[OA\Tag(name: 'Auth', description: 'Login, logout and current user')]
#[OA\Tag(name: 'Users', description: 'Staff accounts (admin only)')]
#[OA\Tag(name: 'Patients', description: 'Patient records (receptionist writes; all staff read)')]
#[OA\Tag(name: 'Doctors', description: 'Doctor profiles and schedules (admin writes; all staff read)')]
#[OA\Tag(name: 'Appointments', description: 'Booking and status flow')]
#[OA\Tag(name: 'Consultations', description: 'Clinical records (doctors only)')]
#[OA\Tag(name: 'Dashboard', description: 'Admin statistics')]
class OpenApiSpec
{
}