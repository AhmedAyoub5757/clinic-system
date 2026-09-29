<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')->latest()->paginate(15);

        return ApiResponse::paginated($users, UserResource::class);
    }

    public function store(StoreUserRequest $request)
    {
        $user = User::create($request->safe()->only(['name', 'email', 'password']));
        $user->assignRole($request->role);

        return ApiResponse::created(new UserResource($user->load('roles')), 'User created');
    }

    public function show(User $user)
    {
        return ApiResponse::success(new UserResource($user->load('roles')));
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $user->update($request->safe()->only(['name', 'email', 'password']));

        if ($request->filled('role')) {
            $user->syncRoles($request->role);
        }

        return ApiResponse::success(new UserResource($user->load('roles')), 'User updated');
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->is($user)) {
            return ApiResponse::error('You cannot delete your own account', 403);
        }

        $user->tokens()->delete(); // revoke their active sessions
        $user->delete();

        return ApiResponse::success(null, 'User deleted');
    }
}