<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', function () {
    return view('welcome');
});

//后台首页显示
Route::get('/admin', 'AdminController@index');

//视频管理
Route::controller('/admin/video', 'VideoController');

//异步通知接口
Route::post('/video/callback', 'VideoController@callbacks');

Route::get('/v/{id}', 'VideoController@show')->where('id','\d+');
