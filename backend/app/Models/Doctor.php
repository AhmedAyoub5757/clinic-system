<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialization',
        'license_number',
        'phone',
        'consultation_fee',
        'slot_duration',
        'bio',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'consultation_fee' => 'decimal:2',
            'slot_duration'    => 'integer',
            'is_active'        => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class);
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }
}
