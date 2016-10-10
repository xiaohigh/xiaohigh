@extends('layout.admin')

@section('title','添加系列')

@section('content')
    <div class="row">
        <div class="col-lg-12">
            <div class="panel panel-default">
                <div class="panel-heading">
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-lg-8 col-md-8 col-md-offset-2">
                            <form role="form" method="post" enctype="multipart/form-data" action="{{url('admin/serie/insert')}}">
                                <div class="form-group">
                                    <label>名称</label>
                                    <input class="form-control" name="name">
                                </div>
                                <div class="form-group">
                                    <label>图片</label>
                                    <input class="form-control" name="profile" type="file">
                                </div>
                                <div class="form-group">
                                    <label>介绍</label>
                                    <textarea name="intro" id="" class="form-control"></textarea>
                                </div>
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
@endsection