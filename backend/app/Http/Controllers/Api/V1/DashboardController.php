<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Support\ApiResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private const CACHE_KEY = 'dashboard:stats';

    public function __invoke()
    {
        $hit = Cache::has(self::CACHE_KEY);

        $stats = Cache::remember(self::CACHE_KEY, now()->addMinutes(5), function () {
            $today = now()->toDateString();

            // Raw query builder: we want plain status strings as keys, not enum casts
            $byStatus = DB::table('appointments')
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            return [
                'patients' => [
                    'total'          => Patient::count(),
                    'new_this_month' => Patient::where('created_at', '>=', now()->startOfMonth())->count(),
                ],
                'doctors' => [
                    'active' => Doctor::where('is_active', true)->count(),
                ],
                'appointments' => [
                    'today'           => Appointment::where('appointment_date', $today)->count(),
                    'upcoming_7_days' => Appointment::whereBetween('appointment_date', [$today, now()->addDays(7)->toDateString()])
                        ->whereIn('status', AppointmentStatus::blocking())
                        ->count(),
                    'by_status'       => collect(AppointmentStatus::cases())
                        ->mapWithKeys(fn ($s) => [$s->value => (int) ($byStatus[$s->value] ?? 0)]),
                ],
                'consultations' => [
                    'this_month' => Consultation::where('created_at', '>=', now()->startOfMonth())->count(),
                ],
                'generated_at' => now()->toDateTimeString(),
            ];
        });

        return ApiResponse::success($stats)->header('X-Cache', $hit ? 'HIT' : 'MISS');
    }
}