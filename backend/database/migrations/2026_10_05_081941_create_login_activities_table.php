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
        Schema::create('login_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestampTz('logged_in_at');
            $table->ipAddress()->nullable();
            $table->string('user_agent', 512)->nullable();

            // "Latest login per user" lookups, and the recent-logins feed.
            $table->index(['user_id', 'logged_in_at']);
            $table->index('logged_in_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_activities');
    }
};
