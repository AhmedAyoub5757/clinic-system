<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\AvailabilityRequest;
use App\Http\Requests\Appointment\CancelAppointmentRequest;
use App\Http\Requests\Appointment\IndexAppointmentRequest;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentStatusRequest;
use App\Http\Resources\AppointmentResource;
use App\Jobs\SendAppointmentNotification;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Services\AppointmentScheduler;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;


class AppointmentController extends Controller
{
    // private const WITH = ['patient', 'doctor.user:id,name'];
    private const WITH = ['patient', 'doctor.user:id,name', 'consultation:id,appointment_id'];

    public function __construct(private AppointmentScheduler $scheduler) {}

    public function index(IndexAppointmentRequest $request)
    {
        $user      = $request->user();
        $sort      = $request->input('sort', 'appointment_date');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column    = ltrim($sort, '-');

        $appointments = Appointment::with(self::WITH)
            // Doctors are always scoped to their own appointments, whatever filters they send
            ->when($user->hasRole('doctor'), fn($q) => $q->where('doctor_id', $user->doctor?->id ?? 0))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->doctor_id, fn($q, $v) => $q->where('doctor_id', $v))
            ->when($request->patient_id, fn($q, $v) => $q->where('patient_id', $v))
            ->when($request->date, fn($q, $v) => $q->where('appointment_date', $v))
            ->when($request->date_from, fn($q, $v) => $q->where('appointment_date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('appointment_date', '<=', $v))
            ->orderBy($column, $direction)
            ->orderBy('start_time', $direction)
            ->paginate($request->integer('per_page', 15));

        return ApiResponse::paginated($appointments, AppointmentResource::class);
    }

    public function show(Appointment $appointment)
    {
        Gate::authorize('view', $appointment);

        return ApiResponse::success(new AppointmentResource($appointment->load(self::WITH)));
    }

    public function store(StoreAppointmentRequest $request)
    {
        $appointment = $this->scheduler->book($request->validated(), $request->user()->id);

        SendAppointmentNotification::dispatch($appointment->id, 'booked');

        return ApiResponse::created(new AppointmentResource($appointment->load(self::WITH)), 'Appointment booked');
    }

    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment)
    {
        $appointment = $this->scheduler->reschedule($appointment, $request->validated());

        // Only notify the patient if the date or time actually changed
        if ($appointment->wasChanged(['appointment_date', 'start_time'])) {
            SendAppointmentNotification::dispatch($appointment->id, 'rescheduled');
        }

        return ApiResponse::success(new AppointmentResource($appointment->load(self::WITH)), 'Appointment updated');
    }

    public function confirm(Appointment $appointment)
    {
        $appointment = $this->transition($appointment, AppointmentStatus::Confirmed);

        SendAppointmentNotification::dispatch($appointment->id, 'confirmed');

        return ApiResponse::success(new AppointmentResource($appointment), 'Appointment confirmed');
    }

    public function cancel(CancelAppointmentRequest $request, Appointment $appointment)
    {
        $appointment = $this->transition($appointment, AppointmentStatus::Cancelled, [
            'cancellation_reason' => $request->cancellation_reason,
        ]);

        SendAppointmentNotification::dispatch($appointment->id, 'cancelled');

        return ApiResponse::success(new AppointmentResource($appointment), 'Appointment cancelled');
    }

    // public function complete(Appointment $appointment)
    // {
    //     Gate::authorize('complete', $appointment);

    //     $this->assertCanTransition($appointment, AppointmentStatus::Completed);

    //     if ($appointment->appointment_date->isFuture()) {
    //         abort(409, 'Cannot complete an appointment that has not happened yet.');
    //     }

    //     return ApiResponse::success(
    //         new AppointmentResource($this->transition($appointment, AppointmentStatus::Completed)),
    //         'Appointment completed'
    //     );
    // }

    public function availability(AvailabilityRequest $request, Doctor $doctor)
    {
        $doctor->load('schedules');
        $date = Carbon::createFromFormat('Y-m-d', $request->date)->startOfDay();

        return ApiResponse::success([
            'doctor_id'     => $doctor->id,
            'date'          => $date->toDateString(),
            'day'           => $date->format('l'),
            'slot_duration' => $doctor->slot_duration,
            'slots'         => $this->scheduler->availableSlots($doctor, $date),
        ]);
    }

    // ---------------------------------------------------------------

    private function assertCanTransition(Appointment $appointment, AppointmentStatus $to): void
    {
        if (! $appointment->status->canTransitionTo($to)) {
            abort(409, "Cannot change status from {$appointment->status->value} to {$to->value}.");
        }
    }

    private function transition(Appointment $appointment, AppointmentStatus $to, array $extra = []): Appointment
    {
        $this->assertCanTransition($appointment, $to);

        $appointment->update(['status' => $to] + $extra);

        return $appointment->load(self::WITH);
    }
}
