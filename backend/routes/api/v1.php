<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
// use Illuminate\Http\Request;
// use App\Support\ApiResponse;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\ConsultationController;
use App\Http\Controllers\Api\V1\DashboardController;


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
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {

    Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // Read: all staff roles
    Route::middleware('role:admin|doctor|receptionist')->group(function () {
        Route::get('patients', [PatientController::class, 'index']);
        Route::get('patients/{patient}', [PatientController::class, 'show']);
    });

    // Write: receptionist only
    Route::middleware('role:receptionist')->group(function () {
        Route::post('patients', [PatientController::class, 'store']);
        Route::put('patients/{patient}', [PatientController::class, 'update']);
        Route::delete('patients/{patient}', [PatientController::class, 'destroy']);
    });

    Route::middleware('role:admin|doctor|receptionist')->group(function () {
        Route::get('doctors', [DoctorController::class, 'index']);
        Route::get('doctors/{doctor}', [DoctorController::class, 'show']);
    });

    Route::middleware('role:admin')->group(function () {
        Route::post('doctors', [DoctorController::class, 'store']);
        Route::put('doctors/{doctor}', [DoctorController::class, 'update']);

        Route::get('admin/dashboard', DashboardController::class);
    });

    Route::middleware('role:admin|doctor|receptionist')->group(function () {
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
        Route::get('doctors/{doctor}/availability', [AppointmentController::class, 'availability']);
    });

    Route::middleware('role:receptionist')->group(function () {
        Route::post('appointments', [AppointmentController::class, 'store']);
        Route::put('appointments/{appointment}', [AppointmentController::class, 'update']);
        Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
        Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    });

    // Route::post('appointments/{appointment}/complete', [AppointmentController::class, 'complete'])
    //     ->middleware('role:doctor');

    Route::middleware('role:doctor')->group(function () {
        Route::post('appointments/{appointment}/consultation', [ConsultationController::class, 'store']);
        Route::get('consultations/{consultation}', [ConsultationController::class, 'show']);
        Route::put('consultations/{consultation}', [ConsultationController::class, 'update']);
        Route::get('patients/{patient}/history', [ConsultationController::class, 'history']);
    });
});
