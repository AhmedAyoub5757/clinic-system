<?php

namespace App\Enums;

enum AppointmentStatus: string
{
    case Pending   = 'pending';
    case Confirmed = 'confirmed';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /** @return self[] */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending   => [self::Confirmed, self::Cancelled],
            self::Confirmed => [self::Completed, self::Cancelled],
            default         => [], // completed and cancelled are final
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }

    /** Statuses that occupy a slot */
    public static function blocking(): array
    {
        return [self::Pending->value, self::Confirmed->value];
    }
}