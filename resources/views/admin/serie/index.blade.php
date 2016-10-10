@extends('layout.admin')

@section('title','系列列表')

@section('content')
    <div class="row">
        <div class="col-lg-12">
            <div class="panel panel-default">
                <div class="panel-heading">列表显示</div>
                <!-- /.panel-heading -->
                <div class="panel-body">
                    <div class="dataTable_wrapper">
                        <div id="dataTables-example_wrapper" class="dataTables_wrapper form-inline dt-bootstrap no-footer">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="dataTables_length" id="dataTables-example_length">
                                        <label>显示
                                            <select name="num" aria-controls="dataTables-example" class="form-control input-sm">
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option></select>条</label>
                                    </div>
                                </div>
                                <div class="col-sm-6">
                                    <form action=""></form>
                                    <div id="dataTables-example_filter" class="dataTables_filter pull-right">
                                        <label>关键字:
                                            <input type="search" class="form-control input-sm" placeholder="" aria-controls="dataTables-example" name="keyword"><button class="btn btn-primary btn-sm">搜索</button></label></div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-12">
                                    <table class="table table-striped table-bordered table-hover dataTable no-footer" id="dataTables-example" role="grid" aria-describedby="dataTables-example_info">
                                        <thead>
                                        <tr role="row">
                                            <th class="sorting_asc" tabindex="0" aria-controls="dataTables-example" rowspan="1" colspan="1" aria-sort="ascending" aria-label="Rendering engine: activate to sort column descending" style="width: 5%">ID</th>
                                            <th class="sorting" tabindex="0" aria-controls="dataTables-example" rowspan="1" colspan="1" aria-label="Browser: activate to sort column ascending" style="width: 30%">系列名称</th>
                                            <th class="sorting" tabindex="0" aria-controls="dataTables-example" rowspan="1" colspan="1" aria-label="Platform(s): activate to sort column ascending" style="width: 30%;">图片</th>
                                            <th class="sorting" tabindex="0" aria-controls="dataTables-example" rowspan="1" colspan="1" aria-label="CSS grade: activate to sort column ascending" style="">操作</th></tr>
                                        </thead>
                                        <tbody>
                                        @foreach($series as $k=>$v)
                                        <tr class="gradeA even" role="row">
                                            <td class="sorting_1">{{$v->id}}</td>
                                            <td>{{$v->name}}</td>
                                            <td><img width="100" src="{{$v->profile}}" alt=""></td>
                                            <td class="center">
                                                <a href="{{url('/admin/serie/edit/')}}?id={{$v->id}}" class="btn btn-primary">修改</a>
                                                <a href="{{url('/admin/serie/delete/')}}?id={{$v->id}}" class="btn btn-warning">删除</a>
                                                <a href="{{url('/admin/video/add/')}}?sid={{$v->id}}" class="btn btn-primary">添加视频</a>

                                            </td>
                                        </tr>
                                        @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="dataTables_info" id="dataTables-example_info" role="status" aria-live="polite">Showing 1 to 10 of 57 entries</div></div>
                                <div class="col-sm-6">
                                    <div class="dataTables_paginate paging_simple_numbers" id="dataTables-example_paginate">
                                        <ul class="pagination">
                                            <li class="paginate_button previous disabled" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_previous">
                                                <a href="#">Previous</a></li>
                                            <li class="paginate_button active" aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">1</a></li>
                                            <li class="paginate_button " aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">2</a></li>
                                            <li class="paginate_button " aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">3</a></li>
                                            <li class="paginate_button " aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">4</a></li>
                                            <li class="paginate_button " aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">5</a></li>
                                            <li class="paginate_button " aria-controls="dataTables-example" tabindex="0">
                                                <a href="#">6</a></li>
                                            <li class="paginate_button next" aria-controls="dataTables-example" tabindex="0" id="dataTables-example_next">
                                                <a href="#">Next</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- /.panel-body --></div>
            <!-- /.panel --></div>
        <!-- /.col-lg-12 --></div>

@endsection