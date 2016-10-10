<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;
use App\Serie;

class SerieController extends Controller
{
    //请求对象
    private $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    /*
     * 系列添加页面
     */
    public function getAdd()
    {
        return view('admin.serie.add');
    }

    /*
     * 执行添加操作
     */
    public function postInsert(Request $request)
    {
        //表单验证
        //创建模型
        $serie = new Serie;
        $serie -> name = $request->input('name');
        $serie -> intro = $request->input('intro');
        $serie -> profile = $this->uploadFile();
        if($serie -> save()) {
            return redirect('/admin/serie/index')->with('info','系列添加成功');
        }else{
            return back()->with('info','系列添加失败');
        }
    }

    /*
     * 文件上传操作
     */
    private function uploadFile()
    {
        //检测
        if($this->request->hasFile('profile')) {
            $dir = './upload/';
            $name = $this->getFileName();
            $this->request->file('profile')->move($dir, $name);
            return trim($dir,'.').$name;
        }else{
            dd('没有文件上传');
        }
    }

    /*
     * 获取文件的名字和后缀
     */
    private function getFileName()
    {
        //获取文件名称
        $name = time().rand(100000, 999999);
        //获取文件后缀
        $suffix = $this->request->file('profile')->getClientOriginalExtension();
        return $name.'.'.$suffix;
    }

    /*
     * 数据列表显示
     */
    public function getIndex()
    {
        //获取数据
        $serie = new Serie;
        $series = $serie -> paginate(10);
        return view('admin.serie.index', ['series'=>$series]);
    }
}
