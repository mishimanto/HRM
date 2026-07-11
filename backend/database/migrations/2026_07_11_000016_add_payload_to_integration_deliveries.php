<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('integration_deliveries', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('event');
        });
    }

    public function down(): void
    {
        Schema::table('integration_deliveries', fn (Blueprint $table) => $table->dropColumn('payload'));
    }
};
