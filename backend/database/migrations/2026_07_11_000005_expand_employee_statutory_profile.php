<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('employees', function (Blueprint $table) {
        $table->enum('gender', ['male', 'female', 'other'])->nullable();
        $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
        $table->string('national_id')->nullable()->unique(); $table->string('tin')->nullable();
        $table->string('taxpayer_category')->default('general'); $table->string('bank_name')->nullable();
        $table->string('bank_account_name')->nullable(); $table->string('bank_account_number')->nullable();
        $table->string('bank_routing_number')->nullable(); $table->string('provident_fund_number')->nullable();
        $table->string('gratuity_number')->nullable(); $table->date('probation_end_date')->nullable();
        $table->date('confirmation_date')->nullable(); $table->string('work_location')->nullable();
    }); }
    public function down(): void { Schema::table('employees', fn (Blueprint $table) => $table->dropColumn(['gender','marital_status','national_id','tin','taxpayer_category','bank_name','bank_account_name','bank_account_number','bank_routing_number','provident_fund_number','gratuity_number','probation_end_date','confirmation_date','work_location'])); }
};
