<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** The design-technique system prompt each report was made with (resources/prompts/image-report-system.md). */
    public function up(): void
    {
        Schema::table('image_reports', function (Blueprint $table) {
            $table->text('system_prompt')->nullable()->after('figures');
        });
    }

    public function down(): void
    {
        Schema::table('image_reports', function (Blueprint $table) {
            $table->dropColumn('system_prompt');
        });
    }
};
