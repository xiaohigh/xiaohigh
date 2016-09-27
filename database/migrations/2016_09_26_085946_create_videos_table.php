<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVideosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        //如果表不存在创建表
        if(!Schema::hasTable('videos')){
            Schema::create('videos', function (Blueprint $table) {
                $table->increments('id');
                $table->string('title')->comment('视频标题');
                $table->string('m3u8')->comment('m3u8文件');
                $table->timestamps();
            });
        }else{
            Schema::table('videos', function ($table) {
                //系列id
                if (!Schema::hasColumn('videos', 'series_id')) {
                    //
                    $table->string('series_id')->comment('系列id');
                }
                //排序
                if (!Schema::hasColumn('videos', 'order')) {
                    //
                    $table->tinyinteger('order')->default(0)->comment('系列id');
                }
                //原始的文件名称
                if (!Schema::hasColumn('videos', 'video')) {
                    //
                    $table->string('video')->comment('原始的文件名称');
                }
                //切片任务的id
                if (!Schema::hasColumn('videos', 'persistentId')) {
                    //
                    $table->string('persistentId')->comment('切片任务id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Schema::drop('videos');
    }
}
