<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Support\ApiResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Spatie\Permission\Exceptions\UnauthorizedException;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Always render JSON for API routes, even if the client forgets the Accept header
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request, Throwable $e) => $request->is('api/*') || $request->expectsJson()
        );

        // 422: validation failed
        $exceptions->render(function (ValidationException $e, Request $request) {
            return ApiResponse::error('Validation failed', 422, $e->errors());
        });

        // 401: missing or invalid token
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return ApiResponse::error('Unauthenticated', 401);
        });

        // 403: authenticated but not allowed (policies, gates, role middleware)
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            return ApiResponse::error('You are not authorized to perform this action', 403);
        });

        // 404: unknown route or model not found (route model binding)
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return ApiResponse::error('Resource not found', 404);
        });

        // 403: authenticated but missing the required role (Spatie)
        $exceptions->render(function (UnauthorizedException $e, Request $request) {
            return ApiResponse::error('You do not have the required role', 403);
        });

        // Other HTTP errors: 405 method not allowed, 429 too many requests, etc.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            return ApiResponse::error($e->getMessage() ?: 'HTTP error', $e->getStatusCode());
        });

        // 500: anything unexpected. Never leak internals in production.
        $exceptions->render(function (Throwable $e, Request $request) {
            $message = config('app.debug') ? $e->getMessage() : 'Server error';
            return ApiResponse::error($message, 500);
        });
    })->create();
