<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * My Profile: what every account can fill in about itself. (Position, age and DOST unit
     * already exist for DOST FIC Focal accounts; FIC members can now set a position too.)
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('organization', 150)->nullable()->after('position');
            $table->string('contact_number', 30)->nullable()->after('organization');
            $table->text('bio')->nullable()->after('contact_number');
            $table->string('avatar_path')->nullable()->after('bio'); // on the "public" disk
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['organization', 'contact_number', 'bio', 'avatar_path']);
        });
    }
};
