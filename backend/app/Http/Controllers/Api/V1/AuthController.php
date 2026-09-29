<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        // Same message for "no such user" and "wrong password",
        // so attackers can't discover which emails exist.
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return ApiResponse::error('Invalid credentials', 401);
        }

        $token = $user->createToken($request->input('device_name', 'api'))->plainTextToken;

        return ApiResponse::success([
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
        ], 'Login successful');
    }

    public function me(Request $request)
    {
        return ApiResponse::success(new UserResource($request->user()));
    }

    public function logout(Request $request)
    {
        // Revoke only the token used for this request (this device/session)
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Logged out successfully');
    }
}