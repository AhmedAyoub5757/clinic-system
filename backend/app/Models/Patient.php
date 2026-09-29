<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

class Patient extends Model
{
    use HasFactory, SoftDeletes, Searchable;

    protected $fillable = [
        'first_name', 'last_name', 'gender', 'date_of_birth', 'phone', 'email',
        'national_id', 'blood_group', 'address',
        'emergency_contact_name', 'emergency_contact_phone',
    ];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date'];
    }

    protected static function booted(): void
    {
        // Generate the patient number from the auto-increment id
        static::created(function (Patient $patient) {
            $patient->forceFill([
                'patient_number' => 'PT-' . str_pad($patient->id, 6, '0', STR_PAD_LEFT),
            ])->saveQuietly();
        });
    }

    // Columns Scout's database driver will search with LIKE
    public function toSearchableArray(): array
    {
        return [
            'id'             => $this->id,
            'patient_number' => $this->patient_number,
            'first_name'     => $this->first_name,
            'last_name'      => $this->last_name,
            'phone'          => $this->phone,
            'email'          => $this->email,
        ];
    }
}