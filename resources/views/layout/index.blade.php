<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>@yield('title')</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
	<link rel="stylesheet" href="{{url('/css/bootstrap.min.css')}}">
	<script src="{{url('/js/jquery-3.1.1.min.js')}}"></script>
	<script src="{{url('/js/bootstrap.min.js')}}"></script>
	<script src="{{url('/js/holder.js')}}"></script>
	<link rel="stylesheet" href="{{url('/css/main.css')}}">
</head>
<body>
	<div class="container" id="container">
		<!-- 头部内容 start -->
		<header>
			<!-- logo -->
			<div class="col-md-2"><img src="holder.js/100px80" alt=""></div>
			
			<!-- 搜索 -->
			<div class="col-md-4 col-md-offset-2" id="search">
				<div class="input-group">
		          <input type="text" class="form-control">
		          <span class="input-group-btn">
		            <button class="btn btn-default" type="button">搜索</button>
		          </span>
		        </div>
			</div>
		</header>
		<div class="clearfix"></div>
		<hr>
		<!-- 头部内容 end -->
		
		<!-- 内容区域 start-->
		<section>
			<div class="content  col-md-10 col-md-offset-1">
				@section('content')
				<!-- 播放器位置 -->
				<div class="ck">
					
				</div>
				@show
				<hr>
				<!-- 列表显示区域 -->
				<div class="list-show col-md-10 col-md-offset-1">
					<div class="col-md-3">
						<img src="holder.js/100px150" alt="">
					</div>
					<div class="video-list col-md-9">
						<table class="table videos">
							<tr>
								<td width="10%">1</td>
								<td width="80%"><span class="glyphicon glyphicon-play-circle"></span>&nbsp;基本安装</td>
								<td width="10%">2:10</td>
							</tr>
							<tr>
								<td width="10%">1</td>
								<td width="80%"><span class="glyphicon glyphicon-play-circle"></span>&nbsp;基本安装</td>
								<td width="10%">2:10</td>
							</tr>
							<tr>
								<td width="10%">1</td>
								<td width="80%"><span class="glyphicon glyphicon-play-circle"></span>&nbsp;基本安装</td>
								<td width="10%">2:10</td>
							</tr>
							<tr>
								<td width="10%">1</td>
								<td width="80%"><span class="glyphicon glyphicon-play-circle"></span>&nbsp;基本安装</td>
								<td width="10%">2:10</td>
							</tr>
						</table>
					</div>
				</div>

				<!-- 评论位置 -->
				<div class="clearfix"></div>
				<hr>

				
				<div class="comment col-md-10 col-md-offset-1">
					<h3>评论</h3>
					<hr>
					<!-- 个人评论 -->
					<div class="personal">
						<div class="col-md-2">
							<img src="holder.js/70x70" alt="">
						</div>
						<div class="col-md-10">
							<textarea class="form-control" style="height:100px;"></textarea>
						</div>
					</div>
					<div class="clearfix"></div>
					<hr>
					<div class="comment-list">
						<!-- 评论 -->
						<div class="media">
							<a class="media-left" href="#">
							  <img src="holder.js/70x70" alt="...">
							</a>
							<div class="media-body">
							  <h4 class="media-heading">哈哈哈</h4>
							  <p>为任意 标签添加 .table 类可以为其赋予基本的样式 — 少量的内补（padding）和水平方向的分隔线。这种方式看起来很多余！？但是我们觉得，表格元素使用的很广泛，如果我们为其赋予默认样式可能会影响例如日历和日期选择之类的插件，所以我们选择将此样式独立出来。</p>

								<!-- 回复 -->
							  	<div class="media">
									<a class="media-left" href="#">
									  <img src="holder.js/70x70" alt="...">
									</a>
									<div class="media-body">
									  <h4 class="media-heading">哈哈哈</h4>
									  <p>为任意 标签添加 .table 类可以为其赋予基本的样式 — 少量的内补（padding）和水平方向的分隔线。这种方式看起来很多余！？但是我们觉得，表格元素使用的很广泛，如果我们为其赋予默认样式可能会影响例如日历和日期选择之类的插件，所以我们选择将此样式独立出来。</p>
									  
										<!-- 回复 -->
									    <div class="media">
											<a class="media-left" href="#">
											  <img src="holder.js/70x70" alt="...">
											</a>
											<div class="media-body">
											  <h4 class="media-heading">哈哈哈</h4>
											  <p>为任意 标签添加 .table 类可以为其赋予基本的样式 — 少量的内补（padding）和水平方向的分隔线。这种方式看起来很多余！？但是我们觉得，表格元素使用的很广泛，如果我们为其赋予默认样式可能会影响例如日历和日期选择之类的插件，所以我们选择将此样式独立出来。</p>
											</div>
										</div>
									</div>
								</div>
							</div>
							
						</div>
						

					</div>
				</div>
			</div>
		</section>
		<!-- 内容区域 end-->

		<!-- 底部内容 start-->
		<div class="clearfix" style="clear:both"></div>
		<footer>
			<div class="beian">备案号:京-11321144</div>		
			<div class="links">
			</div>		
		</footer>
		<!-- 底部内容 end-->
	</div>
</body>
</html>