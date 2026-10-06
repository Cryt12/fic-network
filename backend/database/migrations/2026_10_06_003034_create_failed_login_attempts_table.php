<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Every failed login (successes live in login_activities). Never stores the password tried.
     */
    public function up(): void
    {
        Schema::create('failed_login_attempts', function (Blueprint $table) {
            $table->id();
            // Null when the email doesn't belong to any account.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email'); // as typed (lowercased)
            $table->string('reason', 20); // App\Enums\LoginFailure
            $table->ipAddress()->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestampTz('attempted_at');

            $table->index(['user_id', 'attempted_at']);
            $table->index('attempted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('failed_login_attempts');
    }
};
