<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentScheduler
{
    public function book(array $data, int $createdBy): Appointment
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $doctor = $this->lockDoctor($data['doctor_id']);
            $start  = $this->parse($data['appointment_date'], $data['start_time']);
            $end    = $this->validateSlot($doctor, $start);

            $this->ensureNoConflict($doctor, $start, $end, $data['patient_id']);

            return Appointment::create([
                'patient_id'       => $data['patient_id'],
                'doctor_id'        => $doctor->id,
                'created_by'       => $createdBy,
                'appointment_date' => $start->toDateString(),
                'start_time'       => $start->format('H:i:s'),
                'end_time'         => $end->format('H:i:s'),
                'status'           => AppointmentStatus::Pending,
                'reason'           => $data['reason'] ?? null,
            ]);
        });
    }

    public function reschedule(Appointment $appointment, array $data): Appointment
    {
        if (! in_array($appointment->status->value, AppointmentStatus::blocking(), true)) {
            abort(409, 'Only pending or confirmed appointments can be edited.');
        }

        return DB::transaction(function () use ($appointment, $data) {
            $slotChanged = isset($data['appointment_date']) || isset($data['start_time']);

            if ($slotChanged) {
                $doctor = $this->lockDoctor($appointment->doctor_id);
                $start  = $this->parse(
                    $data['appointment_date'] ?? $appointment->appointment_date->toDateString(),
                    $data['start_time'] ?? substr($appointment->start_time, 0, 5)
                );
                $end = $this->validateSlot($doctor, $start);

                // ignoreId: the appointment must not conflict with itself
                $this->ensureNoConflict($doctor, $start, $end, $appointment->patient_id, $appointment->id);

                $appointment->fill([
                    'appointment_date' => $start->toDateString(),
                    'start_time'       => $start->format('H:i:s'),
                    'end_time'         => $end->format('H:i:s'),
                ]);
            }

            if (array_key_exists('reason', $data)) {
                $appointment->reason = $data['reason'];
            }

            $appointment->save();

            return $appointment;
        });
    }

    /** Free slots for a doctor on a given date */
    public function availableSlots(Doctor $doctor, Carbon $date): array
    {
        $schedule = $doctor->schedules->firstWhere('day_of_week', $date->dayOfWeek);

        if (! $doctor->is_active || ! $schedule) {
            return [];
        }

        $booked = Appointment::where('doctor_id', $doctor->id)
            ->where('appointment_date', $date->toDateString())
            ->whereIn('status', AppointmentStatus::blocking())
            ->get(['start_time', 'end_time']);

        $slots  = [];
        $cursor = $date->copy()->setTimeFromTimeString($schedule->start_time);
        $dayEnd = $date->copy()->setTimeFromTimeString($schedule->end_time);

        while ($cursor->copy()->addMinutes($doctor->slot_duration) <= $dayEnd) {
            $slotStart = $cursor->copy();
            $slotEnd   = $cursor->copy()->addMinutes($doctor->slot_duration);

            $taken = $booked->contains(fn ($b) =>
                $b->start_time < $slotEnd->format('H:i:s') && $b->end_time > $slotStart->format('H:i:s')
            );

            if (! $taken && $slotStart->isFuture()) {
                $slots[] = ['start' => $slotStart->format('H:i'), 'end' => $slotEnd->format('H:i')];
            }

            $cursor->addMinutes($doctor->slot_duration);
        }

        return $slots;
    }

    // ---------------------------------------------------------------

    /** Lock the doctor row so two simultaneous bookings for the same doctor run one after another */
    private function lockDoctor(int $doctorId): Doctor
    {
        $doctor = Doctor::whereKey($doctorId)->lockForUpdate()->firstOrFail();
        $doctor->load('schedules');

        return $doctor;
    }

    private function parse(string $date, string $time): Carbon
    {
        return Carbon::createFromFormat('Y-m-d H:i', "{$date} {$time}");
    }

    /** Rules about the doctor's calendar. Returns the slot's end time. */
    private function validateSlot(Doctor $doctor, Carbon $start): Carbon
    {
        if (! $doctor->is_active) {
            $this->fail('doctor_id', 'This doctor is not accepting appointments.');
        }

        if ($start->isPast()) {
            $this->fail('start_time', 'The appointment must be in the future.');
        }

        $schedule = $doctor->schedules->firstWhere('day_of_week', $start->dayOfWeek);

        if (! $schedule) {
            $this->fail('appointment_date', 'The doctor does not work on ' . $start->format('l') . '.');
        }

        $dayStart = $start->copy()->setTimeFromTimeString($schedule->start_time);
        $dayEnd   = $start->copy()->setTimeFromTimeString($schedule->end_time);
        $end      = $start->copy()->addMinutes($doctor->slot_duration);

        if ($start < $dayStart || $end > $dayEnd) {
            $this->fail('start_time', sprintf(
                'Outside working hours (%s to %s).',
                $dayStart->format('H:i'),
                $dayEnd->format('H:i')
            ));
        }

        $minutesFromShiftStart = ($start->timestamp - $dayStart->timestamp) / 60;

        if ($minutesFromShiftStart % $doctor->slot_duration !== 0) {
            $this->fail('start_time', "Time must align with the doctor's {$doctor->slot_duration}-minute slots.");
        }

        return $end;
    }

    /** Rules about other bookings: the doctor's and the patient's */
    private function ensureNoConflict(Doctor $doctor, Carbon $start, Carbon $end, int $patientId, ?int $ignoreId = null): void
    {
        // Overlap test: existing.start < new.end AND existing.end > new.start
        $overlapping = Appointment::query()
            ->where('appointment_date', $start->toDateString())
            ->whereIn('status', AppointmentStatus::blocking())
            ->where('start_time', '<', $end->format('H:i:s'))
            ->where('end_time', '>', $start->format('H:i:s'))
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId));

        if ((clone $overlapping)->where('doctor_id', $doctor->id)->exists()) {
            abort(409, 'This time slot is already booked for the selected doctor.');
        }

        if ((clone $overlapping)->where('patient_id', $patientId)->exists()) {
            abort(409, 'The patient already has an appointment at this time.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => [$message]]);
    }
}