<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Profile of a DOST FIC Focal account (regional office). Empty for other roles.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('name');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
            $table->unsignedTinyInteger('age')->nullable()->after('last_name');
            $table->string('position')->nullable()->after('age');
            $table->string('dost_unit')->nullable()->after('position'); // DOST unit / division
            $table->string('region', 10)->nullable()->after('dost_unit'); // code from config/regions.php
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_name', 'last_name', 'age', 'position', 'dost_unit', 'region']);
        });
    }
};
