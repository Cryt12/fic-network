<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Infographics generated from the Dashboard data through OpenRouter (superadmin only).
     * The prompt and the numbers sent are kept, so every image can be checked against them.
     */
    public function up(): void
    {
        Schema::create('image_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('model', 100);
            $table->jsonb('options');   // aspect ratio, resolution, detail level, extra instructions
            $table->jsonb('figures');   // the exact numbers the prompt used
            $table->text('prompt');
            $table->string('status', 20)->default('pending'); // pending, succeeded, failed
            $table->string('image_path')->nullable();       // on the private "local" disk
            $table->text('error')->nullable();
            $table->decimal('cost_usd', 10, 6)->nullable(); // as reported by OpenRouter
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_reports');
    }
};
