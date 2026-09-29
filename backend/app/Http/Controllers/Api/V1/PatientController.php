<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\IndexPatientRequest;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Support\ApiResponse;

class PatientController extends Controller
{
    public function index(IndexPatientRequest $request)
    {
        $sort      = $request->input('sort', '-created_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column    = ltrim($sort, '-');
        $perPage   = $request->integer('per_page', 15);

        $filters = fn ($query) => $query
            ->when($request->gender, fn ($q, $v) => $q->where('gender', $v))
            ->when($request->blood_group, fn ($q, $v) => $q->where('blood_group', $v));

        if ($request->filled('search')) {
            // Scout search, with our filters applied on the underlying query
            $patients = Patient::search($request->search)
                ->query($filters)
                ->orderBy($column, $direction)
                ->paginate($perPage);
        } else {
            $patients = $filters(Patient::query())
                ->orderBy($column, $direction)
                ->paginate($perPage);
        }

        return ApiResponse::paginated($patients, PatientResource::class);
    }

    public function store(StorePatientRequest $request)
    {
        $patient = Patient::create($request->validated());

        return ApiResponse::created(new PatientResource($patient->refresh()), 'Patient registered');
    }

    public function show(Patient $patient)
    {
        return ApiResponse::success(new PatientResource($patient));
    }

    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $patient->update($request->validated());

        return ApiResponse::success(new PatientResource($patient), 'Patient updated');
    }

    public function destroy(Patient $patient)
    {
        $patient->delete(); // soft delete

        return ApiResponse::success(null, 'Patient deleted');
    }
}