@extends('layout.admin')

@section('title','视频添加')

@section('content')
<div class="row">
	<div class="col-lg-12">
        <div class="panel panel-default">
            <div class="panel-heading">
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-lg-8 col-md-8 col-md-offset-2">
                        <form role="form" method="post" enctype="multipart/form-data" action="{{url('admin/video/insert')}}">
                            <div class="form-group">
                                <label>名称</label>
                                <input class="form-control" name="title">
                            </div>
                            <div class="form-group">
                                <button type="button" class="btn btn-warning" id="pickfiles">点击选择视频</button>
                            </div>
                            <div id="container" style="border:solid 1px #ddd">
                                <table class="table table-bordered" id="v-list">
                                    <tr id="tr"><td width="20%">视频名称</td><td width="20%">视频大小</td><td width="50%">详情</td><td width="10%">状态</td></tr>
                                </table>
                            </div>
                            <div class="form-group">
                                <label>系列id</label>
                                <select class="form-control" name="series_id">
                                    <option value='0'>1</option>
                                </select>
                            </div>
                            {{csrf_field()}}
                            <input type="hidden" name="video" value="">
                            <input type="hidden" name="persistentId" value="">
                            <button type="submit" class="btn btn-primary">点击添加</button>
                        </form>
                    </div>
                </div>
                <!-- /.row (nested) -->
            </div>
            <!-- /.panel-body -->
        </div>
        <!-- /.panel -->
    </div>
</div>

<script type="text/javascript">
var uploader = Qiniu.uploader({
    runtimes: 'html5,flash,html4',      // 上传模式，依次退化
    browse_button: 'pickfiles',         // 上传选择的点选按钮，必需
    // 在初始化时，uptoken，uptoken_url，uptoken_func三个参数中必须有一个被设置
    // 切如果提供了多个，其优先级为uptoken > uptoken_url > uptoken_func
    // 其中uptoken是直接提供上传凭证，uptoken_url是提供了获取上传凭证的地址，如果需要定制获取uptoken的过程则可以设置uptoken_func
    uptoken : '{{$token}}', // uptoken是上传凭证，由其他程序生成
    // uptoken_url: '{{url("/admin/video/token")}}',         // Ajax请求uptoken的Url，强烈建议设置（服务端提供）
    // uptoken_func: function(file){    // 在需要获取uptoken时，该方法会被调用
    //    // do something
    //    return uptoken;
    // },
    get_new_uptoken: false,             // 设置上传文件的时候是否每次都重新获取新的uptoken
    // downtoken_url: '',
    // Ajax请求downToken的Url，私有空间时使用，JS-SDK将向该地址POST文件的key和domain，服务端返回的JSON必须包含url字段，url值为该文件的下载地址
    // unique_names: true,              // 默认false，key为文件名。若开启该选项，JS-SDK会为每个文件自动生成key（文件名）
    save_key: true,                  // 默认false。若在服务端生成uptoken的上传策略中指定了sava_key，则开启，SDK在前端将不对key进行任何处理
    domain: '{{\Config::get('qiniu.map.videos')}}',     // bucket域名，下载资源时用到，必需
    container: 'container',             // 上传区域DOM ID，默认是browser_button的父元素
    max_file_size: '100mb',             // 最大文件体积限制
    flash_swf_url: '/backend/bower_components/plupload/js/Moxie.swf',  //引入flash，相对路径
    max_retries: 3,                     // 上传失败最大重试次数
    dragdrop: true,                     // 开启可拖曳上传
    drop_element: 'container',          // 拖曳上传区域元素的ID，拖曳文件或文件夹后可触发上传
    chunk_size: '4mb',                  // 分块上传时，每块的体积
    auto_start: true,                   // 选择文件后自动上传，若关闭需要自己绑定事件触发上传
    
    init: {
        'FilesAdded': function(up, files) {
            plupload.each(files, function(file) {
                // 文件添加进队列后，处理相关的事情
                var newTr = $('#tr').clone();
                //获取文件名称
                newTr.find('td:eq(0)').html(file.name);
                //获取尺寸
                var fileSize = plupload.formatSize(file.size).toUpperCase();
                newTr.find('td:eq(1)').html(fileSize);
                var bar = '<div class="progress"> <div class="active progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width: 2%"></div> </div>'
                newTr.find('td:eq(2)').html(bar);
                newTr.find('td:eq(3)').html('上传中');
                newTr.appendTo('#v-list');
            });
        },
        'BeforeUpload': function(up, file) {
               // 每个文件上传前，处理相关的事情
        },
        'UploadProgress': function(up, file) {
               // 每个文件上传时，处理相关的事情
               $('.progress-bar:last').css('width',file.percent+'%');
        },
        'FileUploaded': function(up, file, info) {
                //修改文本
               $('.progress:last').parents('tr').find('td:eq(3)').html('完成');
               //移出class
               $('.progress-bar:last').removeClass('active');
                //设置name的值
                var info = $.parseJSON(info);
                $('input[name=video]').val(info.key);
                $('input[name=persistentId]').val(info.persistentId);
               // 每个文件上传成功后，处理相关的事情
               // 其中info是文件上传成功后，服务端返回的json，形式如：
               // {
               //    "hash": "Fh8xVqod2MQ1mocfI4S4KpRL6D98",
               //    "key": "gogopher.jpg"
               //  }
               // 查看简单反馈
               // var domain = up.getOption('domain');
               // var res = parseJSON(info);
               // var sourceLink = domain + res.key; 获取上传成功后的文件的Url
        },
        'Error': function(up, err, errTip) {
               //上传出错时，处理相关的事情
        },
        'UploadComplete': function() {
               //队列文件处理完毕后，处理相关的事情
        },
        'Key': function(up, file) {
            // 若想在前端对每个文件的key进行个性化处理，可以配置该函数
            // 该配置必须要在unique_names: false，save_key: false时才生效

            var key = "";
            // do something with key here
            return key
        }
    }
});


</script>
@endsection

@section('js')
<script src="{{asset('/backend/bower_components/plupload/js/plupload.full.min.js')}}"></script>
<script type="text/javascript" src="/backend/bower_components/plupload/js/i18n/zh_CN.js"></script>
<script src="{{asset('/backend/bower_components/qiniu/dist/qiniu.js')}}"></script>
@endsection