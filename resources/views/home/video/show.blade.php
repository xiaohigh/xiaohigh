@extends('layout.index')

@section('title','视频播放页面')

@section('content')

<script type="text/javascript" src="{{url('/js/ckplayer/ckplayer.js')}}" charset="utf-8"></script>
<!-- 播放器位置 -->
<div class="ck" id="a1">
	@if(Config::get('web.play_type') == 'vj')
	<link rel="stylesheet" href="/plugin/videojs/dist/video-js.min.css">
	<video id='example-video' style="width:100%;height:100%;" class="video-js vjs-default-skin" controls>
	  <source
	     src="{{$video->m3u8}}"
	     type="application/x-mpegURL">
	</video>
	<script src="/plugin/videojs/dist/video.js"></script>
	<script src="/plugin/videojs-contrib-hls/dist/videojs-contrib-hls.min.js"></script>
	<script>
	var player = videojs('example-video');
	</script>
	@endif
</div>
@if(Config::get('web.play_type') == 'ck')
<script type="text/javascript">
	var flashvars={
		f:'/js/ckplayer/m3u8.swf',
		a:'{{$video->m3u8}}',
		s:4,
		c:0
	};
	var params={bgcolor:'#FFF',allowFullScreen:true,allowScriptAccess:'always',wmode:'transparent'};
	CKobject.embedSWF('/js/ckplayer/ckplayer.swf','a1','ckplayer_a1','100%','100%',flashvars,params);	
</script>
@endif

@endsection