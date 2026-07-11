<?php
use Illuminate\Database\Migrations\Migration;use Illuminate\Database\Schema\Blueprint;use Illuminate\Support\Facades\Schema;
return new class extends Migration{public function up():void{Schema::table('survey_responses',fn(Blueprint$t)=>$t->unique(['survey_id','user_id'],'survey_user_response_unique'));}public function down():void{Schema::table('survey_responses',fn(Blueprint$t)=>$t->dropUnique('survey_user_response_unique'));}};
