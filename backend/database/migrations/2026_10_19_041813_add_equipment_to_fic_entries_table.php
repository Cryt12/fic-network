<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The FIC's equipment: a list of { name, operation_status, utilization_status, capacity }.
     */
    public function up(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->jsonb('equipment')->default('[]')->after('assistance_other');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->dropColumn('equipment');
        });
    }
};
