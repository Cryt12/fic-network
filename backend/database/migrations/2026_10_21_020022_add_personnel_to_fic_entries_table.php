<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * FIC personnel. Nullable: entries made before these fields existed are "not reported yet"
     * (not zero) until their owner edits them; the form requires both from now on.
     */
    public function up(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->unsignedInteger('fulltime_personnel')->nullable()->after('host_institution');   // stationed in the FIC
            $table->unsignedInteger('associate_personnel')->nullable()->after('fulltime_personnel'); // not reporting full-time in the FIC
        });
    }

    public function down(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->dropColumn(['fulltime_personnel', 'associate_personnel']);
        });
    }
};
