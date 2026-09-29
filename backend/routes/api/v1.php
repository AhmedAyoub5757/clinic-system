<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
// use Illuminate\Http\Request;
// use App\Support\ApiResponse;
use App\Http\Controllers\Api\V1\UserController;

Route::get('/ping', function () {
    return response()->json(['message' => 'pong']);
});



// Route::get('/test-success', fn () => ApiResponse::success(['name' => 'Clinic API'], 'It works'));

// Route::post('/test-validation', function (Request $request) {
//     $request->validate([
//         'email' => 'required|email',
//         'name'  => 'required|min:3',
//     ]);
//     return ApiResponse::success();
// });

// Route::get('/test-error', fn () => throw new Exception('Something broke'));

// Route::get('/test-auth', fn () => ApiResponse::success())->middleware('auth:sanctum');

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});