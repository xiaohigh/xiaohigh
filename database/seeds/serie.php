<?php

use Illuminate\Database\Seeder;
class serie extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        $arr = [];
        for ($i=0;$i<50;$i++) {
            $tmp = [];
            $tmp['name'] = str_random(10);
            $tmp['intro'] = str_random(100);
            $tmp['profile'] = '/upload/1475323721478052.jpg';
            $tmp['created_at'] = date('Y-m-d H:i:s');
            $tmp['updated_at'] = date('Y-m-d H:i:s');
            $arr[] = $tmp;
        }
        DB::table('series')->insert($arr);
    }
}
