<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use Config;
use Qiniu\Auth;
use Qiniu\Storage\UploadManager;
use App\Video;

class VideoController extends Controller
{
    /**
     * 视频添加页面
     */
    public function getAdd()
    {
        return view('admin.video.add',[
            'token' => $this->getToken()
            ]);
    }

    /**
     * 视频插入操作
     */
    public function postInsert(Request $request)
    {
        $video = new Video;
        $video -> title = $request->input('title');
        $video -> video = $request->input('video');
        $video -> persistentId = $request->input('persistentId');
        if($video->save()) {
            return redirect('/admin/video/list')->with('info','添加成功');
        }
    }

    /**
     * 视频列表显示
     */
    public function getList()
    {

    }

    /**
     * 获取token
     */
    private function getToken()
    {
        //仓库名称
        $bucket = Config::get('qiniu.bucket');
        //鉴权对象创建
        $auth = new Auth(Config::get('qiniu.AccessKey'), Config::get('qiniu.SecretKey'));
        //
        $pfopOps = "avthumb/m3u8/segtime/5/ab/128k/ar/44100/acodec/libfaac/r/30/vb/640k/vcodec/libx264/stripmeta/0";
        $policy = array(
            'persistentOps' => $pfopOps,
            'persistentPipeline' => Config::get('qiniu.pipeline'),
            'persistentNotifyUrl' => 'http://xdl.xiaohigh.com',
        );

        $upToken = $auth->uploadToken($bucket, null, 3600, $policy);

        return  $upToken;
    }

    /**
     * 用来获取任务状态
     */
    public function getPfopStatus(Request $request)
    {
        $id = $request->input('id');
        $url = "http://api.qiniu.com/status/get/prefop?id=$id";
        $resp = file_get_contents($url);
        echo $resp;
    }

    /**
     * 通知操作
     */
    public function callbacks()
    {
        //获取请求内容
        $_body = file_get_contents('php://input');
        //进行json解析
        $data = json_decode($_body, true);
        //查看数据
        $video = Video::where('video',$data['inputKey'])->firstOrFail();
        //
        $video -> m3u8 = $data['items'][0]['key'];
        if($video -> save()) {
            return 'ok';
        }else{
            return 'fail';
        }
    }

    /**
     * 视频显示
     */
    public function show($id)
    {
        $video = Video::findOrFail($id);
        $video->m3u8 = $this->format($video->m3u8);
        return view('home.video.show', ['video'=>$video]);
    }

    /**
     * 格式化url地址
     */
    private function format($url)
    {
        //
        $bucket = Config::get('qiniu.bucket');
        return Config::get('qiniu.map.'.$bucket).'/'.$url;
    }



}
