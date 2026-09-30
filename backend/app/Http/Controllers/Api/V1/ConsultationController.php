<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Consultation\PatientHistoryRequest;
use App\Http\Requests\Consultation\StoreConsultationRequest;
use App\Http\Requests\Consultation\UpdateConsultationRequest;
use App\Http\Resources\ConsultationResource;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Patient;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ConsultationController extends Controller
{
    private const WITH         = ['items', 'patient', 'doctor.user:id,name', 'appointment:id,appointment_date,start_time'];
    private const HISTORY_WITH = ['items', 'doctor.user:id,name', 'appointment:id,appointment_date,start_time'];

    public function store(StoreConsultationRequest $request, Appointment $appointment)
    {
        Gate::authorize('complete', $appointment); // must be this doctor's own appointment

        $consultation = DB::transaction(function () use ($request, $appointment) {
            // Lock the row so a double-click can't record two consultations
            $locked = Appointment::whereKey($appointment->id)->lockForUpdate()->firstOrFail();

            if (! $locked->status->canTransitionTo(AppointmentStatus::Completed)) {
                abort(409, "Only confirmed appointments can have a consultation (current status: {$locked->status->value}).");
            }

            if ($locked->appointment_date->isFuture()) {
                abort(409, 'Cannot record a consultation for an appointment that has not happened yet.');
            }

            $consultation = Consultation::create(
                $request->safe()->except('prescriptions') + [
                    'appointment_id' => $locked->id,
                    'patient_id'     => $locked->patient_id,
                    'doctor_id'      => $locked->doctor_id,
                ]
            );

            $consultation->items()->createMany($request->validated('prescriptions') ?? []);

            $locked->update(['status' => AppointmentStatus::Completed]);

            return $consultation;
        });

        return ApiResponse::created(
            new ConsultationResource($consultation->load(self::WITH)),
            'Consultation recorded and appointment completed'
        );
    }

    public function show(Consultation $consultation)
    {
        Gate::authorize('view', $consultation);

        return ApiResponse::success(new ConsultationResource($consultation->load(self::WITH)));
    }

    public function update(UpdateConsultationRequest $request, Consultation $consultation)
    {
        Gate::authorize('update', $consultation);

        DB::transaction(function () use ($request, $consultation) {
            $consultation->update($request->safe()->except('prescriptions'));

            if ($request->has('prescriptions')) {
                $consultation->items()->delete();
                $consultation->items()->createMany($request->validated('prescriptions'));
            }
        });

        return ApiResponse::success(
            new ConsultationResource($consultation->load(self::WITH)),
            'Consultation updated'
        );
    }

    public function history(PatientHistoryRequest $request, Patient $patient)
    {
        $consultations = Consultation::with(self::HISTORY_WITH)
            ->where('patient_id', $patient->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::paginated($consultations, ConsultationResource::class);
    }
}