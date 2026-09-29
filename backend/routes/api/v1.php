<?php

use Illuminate\Support\Facades\Route;
// use Illuminate\Http\Request;
// use App\Support\ApiResponse;

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