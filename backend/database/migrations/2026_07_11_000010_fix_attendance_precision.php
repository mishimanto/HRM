<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('attendances',fn(Blueprint$t)=>$t->decimal('total_hours',6,2)->nullable()->change());}public function down():void{Schema::table('attendances',fn(Blueprint$t)=>$t->integer('total_hours')->nullable()->change());}};
