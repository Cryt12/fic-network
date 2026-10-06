<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Philippine provinces, cities/municipalities and barangays (PSGC), loaded by PlaceSeeder.
     * Map positions are looked up lazily (App\Support\PlaceLocator) and cached here.
     */
    public function up(): void
    {
        Schema::create('places', function (Blueprint $table) {
            $table->string('code', 10)->primary(); // PSGC code
            $table->string('name');
            $table->string('level', 10); // province | city | barangay
            $table->string('parent_code', 10)->nullable()->index();
            $table->string('region', 10)->index(); // code from config/regions.php
            $table->boolean('is_city')->default(false);

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->jsonb('bounds')->nullable(); // [[south, west], [north, east]]
            $table->timestampTz('located_at')->nullable(); // when the lookup ran (found or not)

            $table->index(['level', 'region']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
