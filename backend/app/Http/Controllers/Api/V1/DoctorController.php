<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\IndexDoctorRequest;
use App\Http\Requests\Doctor\StoreDoctorRequest;
use App\Http\Requests\Doctor\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DoctorController extends Controller
{
    public function index(IndexDoctorRequest $request)
    {
        $sort      = $request->input('sort', '-created_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column    = ltrim($sort, '-');
        $perPage   = $request->integer('per_page', 15);
        $isActive  = $request->has('is_active') ? $request->boolean('is_active') : true; // active only by default

        // One cache entry per unique combination of filters + page
        $key   = 'doctors:list:' . md5(json_encode($request->validated()) . '|page:' . $request->integer('page', 1));
        $cache = Cache::tags('doctors');
        $hit   = $cache->has($key);

        $doctors = $cache->remember($key, now()->addMinutes(10), function () use ($request, $isActive, $column, $direction, $perPage) {
            return Doctor::with(['user:id,name,email', 'schedules'])
                ->where('is_active', $isActive)
                ->when($request->specialization, fn ($q, $v) => $q->where('specialization', $v))
                ->when($request->filled('available_on'), fn ($q) => $q->whereHas(
                    'schedules', fn ($s) => $s->where('day_of_week', $request->integer('available_on'))
                ))
                ->when($request->search, fn ($q, $s) => $q->where(fn ($q) => $q
                    ->where('specialization', 'like', "%{$s}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%"))
                ))
                ->orderBy($column, $direction)
                ->paginate($perPage);
        });

        // X-Cache header lets us see hits and misses in Postman
        return ApiResponse::paginated($doctors, DoctorResource::class)
            ->header('X-Cache', $hit ? 'HIT' : 'MISS');
    }

    public function show(Doctor $doctor)
    {
        return ApiResponse::success(new DoctorResource($doctor->load(['user:id,name,email', 'schedules'])));
    }

    public function store(StoreDoctorRequest $request)
    {
        $doctor = DB::transaction(function () use ($request) {
            $doctor = Doctor::create($request->safe()->except('schedules'));
            $doctor->schedules()->createMany($request->validated('schedules'));

            return $doctor;
        });

        Cache::tags('doctors')->flush();

        return ApiResponse::created(
            new DoctorResource($doctor->load(['user:id,name,email', 'schedules'])),
            'Doctor profile created'
        );
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor)
    {
        DB::transaction(function () use ($request, $doctor) {
            $doctor->update($request->safe()->except('schedules'));

            // If schedules are sent, they replace the old set
            if ($request->has('schedules')) {
                $doctor->schedules()->delete();
                $doctor->schedules()->createMany($request->validated('schedules'));
            }
        });

        Cache::tags('doctors')->flush();

        return ApiResponse::success(
            new DoctorResource($doctor->load(['user:id,name,email', 'schedules'])),
            'Doctor profile updated'
        );
    }
}