<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'first_name'    => fake()->firstName(),
            'last_name'     => fake()->lastName(),
            'gender'        => fake()->randomElement(['male', 'female', 'other']),
            'date_of_birth' => fake()->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'phone'         => '03' . fake()->numerify('#########'),
            'email'         => fake()->optional(0.7)->safeEmail(),
            'national_id'   => fake()->unique()->numerify('#############'),
            'blood_group'   => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'address'       => fake()->address(),
        ];
    }
}
