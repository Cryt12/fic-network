<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Food MSME partner counts reported by DOST FIC Focal accounts for their region.
     * A region's figure is the sum of its reports (each report is a new batch).
     */
    public function up(): void
    {
        Schema::create('msme_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('region', 10); // the Focal's region, code from config/regions.php

            $table->unsignedInteger('msme_partners');
            $table->unsignedInteger('msmes_with_lto');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'deleted_at']);
        });

        DB::statement('ALTER TABLE msme_reports ADD CONSTRAINT msme_reports_lto_within_partners CHECK (msmes_with_lto <= msme_partners)');
    }

    public function down(): void
    {
        Schema::dropIfExists('msme_reports');
    }
};
