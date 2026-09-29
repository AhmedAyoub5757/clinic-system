<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialization');
            $table->string('license_number')->unique();
            $table->string('phone', 20)->nullable();
            $table->decimal('consultation_fee', 8, 2)->default(0);
            $table->unsignedSmallInteger('slot_duration')->default(30); // minutes per appointment
            $table->text('bio')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('specialization');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
