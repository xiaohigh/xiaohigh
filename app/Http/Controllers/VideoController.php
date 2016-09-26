<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

class VideoController extends Controller
{
    /**
     * 视频添加页面
     */
    public function getAdd()
    {
        return view('admin.video.add');
    }

    /**
     * 视频列表显示
     */
    public function getList()
    {

    }
}
