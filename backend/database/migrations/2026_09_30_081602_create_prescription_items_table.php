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
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->string('medicine_name', 150);
            $table->string('dosage', 50);              // e.g. "500mg"
            $table->string('frequency', 100);          // e.g. "3 times a day"
            $table->unsignedSmallInteger('duration_days');
            $table->string('instructions')->nullable(); // e.g. "After meals"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
