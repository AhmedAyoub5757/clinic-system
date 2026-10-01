<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\User\IndexUserRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;

class UserController extends Controller
{
    // public function index()
    // {
    //     $users = User::with('roles')->latest()->paginate(15);

    //     return ApiResponse::paginated($users, UserResource::class);
    // }

    public function index(IndexUserRequest $request)
    {
        $users = User::with('roles')
            ->when($request->role, fn($q, $role) => $q->role($role)) // Spatie scope
            ->when($request->boolean('without_doctor_profile'), fn($q) => $q->doesntHave('doctor'))
            ->when($request->search, fn($q, $s) => $q->where(
                fn($q) => $q
                    ->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
            ))
            ->latest()
            ->orderByDesc('id') // seeded rows share a timestamp, so break ties
            ->paginate($request->integer('per_page', 15));

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

        Cache::tags('doctors')->flush();
        return ApiResponse::success(new UserResource($user->load('roles')), 'User updated');
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->user()->is($user)) {
            return ApiResponse::error('You cannot delete your own account', 403);
        }

        try {
            // Together or not at all: if the delete fails, the tokens must survive too
            DB::transaction(function () use ($user) {
                $user->tokens()->delete();
                $user->delete();
            });
        } catch (QueryException $e) {
            // 23000 = foreign key violation: appointments, consultations or a doctor profile still point here
            if ($e->getCode() === '23000') {
                abort(409, 'This user has related records (appointments or consultations) and cannot be deleted.');
            }
            throw $e;
        }

        Cache::tags('doctors')->flush();

        return ApiResponse::success(null, 'User deleted');
    }
}
