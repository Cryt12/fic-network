<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Province, city/municipality and barangay (PSGC codes into `places`). Nullable only
     * because entries made before these fields existed don't have them; the form requires them.
     */
    public function up(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->string('province_code', 10)->nullable()->after('region');
            $table->string('city_code', 10)->nullable()->after('province_code');
            $table->string('barangay_code', 10)->nullable()->after('city_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fic_entries', function (Blueprint $table) {
            $table->dropColumn(['province_code', 'city_code', 'barangay_code']);
        });
    }
};
