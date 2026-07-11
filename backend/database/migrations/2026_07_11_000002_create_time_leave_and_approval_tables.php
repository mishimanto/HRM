<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('date');
            $table->enum('type', ['government', 'festival', 'company', 'optional'])->default('government');
            $table->boolean('is_paid')->default(true);
            $table->boolean('is_recurring')->default(false);
            $table->timestamps();
            $table->unique(['company_id', 'branch_id', 'date', 'name']);
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->time('starts_at');
            $table->time('ends_at');
            $table->unsignedSmallInteger('break_minutes')->default(60);
            $table->unsignedSmallInteger('grace_minutes')->default(10);
            $table->unsignedSmallInteger('standard_minutes')->default(480);
            $table->unsignedSmallInteger('overtime_after_minutes')->default(480);
            $table->json('weekly_off_days')->nullable();
            $table->boolean('is_night_shift')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['employee_id', 'effective_from', 'effective_to']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->after('employee_id')->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('worked_minutes')->nullable();
            $table->unsignedSmallInteger('late_minutes')->default(0);
            $table->unsignedSmallInteger('overtime_minutes')->default(0);
            $table->boolean('is_manual')->default(false);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('code');
            $table->decimal('annual_entitlement', 6, 2)->default(0);
            $table->enum('accrual_frequency', ['none', 'monthly', 'quarterly', 'yearly'])->default('yearly');
            $table->decimal('accrual_amount', 6, 2)->default(0);
            $table->decimal('max_carry_forward', 6, 2)->default(0);
            $table->decimal('max_balance', 6, 2)->nullable();
            $table->unsignedSmallInteger('minimum_service_days')->default(0);
            $table->boolean('is_paid')->default(true);
            $table->boolean('requires_document')->default(false);
            $table->boolean('is_encashable')->default(false);
            $table->boolean('gender_specific')->default(false);
            $table->string('eligible_gender')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['company_id', 'code']);
        });

        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->year('year');
            $table->decimal('opening_balance', 7, 2)->default(0);
            $table->decimal('accrued', 7, 2)->default(0);
            $table->decimal('used', 7, 2)->default(0);
            $table->decimal('adjusted', 7, 2)->default(0);
            $table->decimal('encashed', 7, 2)->default(0);
            $table->timestamps();
            $table->unique(['employee_id', 'leave_type_id', 'year']);
        });

        Schema::table('leaves', function (Blueprint $table) {
            $table->foreignId('leave_type_id')->nullable()->after('employee_id')->constrained()->nullOnDelete();
            $table->decimal('requested_days', 6, 2)->nullable();
            $table->enum('day_portion', ['full', 'first_half', 'second_half'])->default('full');
            $table->string('attachment_path')->nullable();
        });

        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable');
            $table->unsignedSmallInteger('step')->default(1);
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('comments')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();
            $table->index(['approver_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropConstrainedForeignId('leave_type_id');
            $table->dropColumn(['requested_days', 'day_portion', 'attachment_path']);
        });
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leave_types');
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('shift_id');
            $table->dropColumn(['worked_minutes', 'late_minutes', 'overtime_minutes', 'is_manual']);
        });
        Schema::dropIfExists('shift_assignments');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('holidays');
    }
};
