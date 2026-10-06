<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adding a FIC field later: a new migration, FicEntryRequest::fieldRules(),
     * FicEntryResource, and frontend/src/features/entries/fields.ts.
     */
    public function up(): void
    {
        Schema::create('fic_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('region', 10); // code from config/regions.php
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);

            $table->string('name');
            $table->string('host_institution');

            $table->unsignedInteger('products_developed');
            // Adopted by an MSME or a university spin-off through a technology licensing agreement (TLA).
            $table->unsignedInteger('products_commercialized');
            $table->string('lto_status', 20);

            $table->unsignedInteger('msmes_needing_fabrication');
            $table->text('msmes_needing_fabrication_details')->nullable();
            $table->unsignedInteger('msmes_needing_tech_interventions');
            $table->unsignedInteger('msmes_served');

            $table->jsonb('assistance_types')->default('[]'); // AssistanceType values
            $table->string('assistance_other')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'deleted_at']);
        });

        // Defence in depth: the database itself refuses impossible coordinates.
        DB::statement('ALTER TABLE fic_entries ADD CONSTRAINT fic_entries_latitude_range CHECK (latitude BETWEEN -90 AND 90)');
        DB::statement('ALTER TABLE fic_entries ADD CONSTRAINT fic_entries_longitude_range CHECK (longitude BETWEEN -180 AND 180)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fic_entries');
    }
};
