/*global plupload */
/*global qiniu */
function FileProgress(file, targetID) {
    this.fileProgressID = file.id;
    this.file = file;

    this.opacity = 100;
    this.height = 0;
    this.fileProgressWrapper = $('#' + this.fileProgressID);
    if (!this.fileProgressWrapper.length) {
        this.fileProgressWrapper = $('<tr></tr>');
        var Wrappeer = this.fileProgressWrapper;
        Wrappeer.attr('id', this.fileProgressID).addClass('progressContainer');

        var progressText = $("<td/>");
        progressText.addClass('progressName').text(file.name);


        var fileSize = plupload.formatSize(file.size).toUpperCase();
        var progressSize = $("<td/>");
        progressSize.addClass("progressFileSize").text(fileSize);

        var progressBarTd = $("<td/>");
        var progressBarBox = $("<div/>");
        progressBarBox.addClass('info');
        var progressBarWrapper = $("<div/>");
        progressBarWrapper.addClass("progress progress-striped");


        var progressBar = $("<div/>");
        progressBar.addClass("progress-bar progress-bar-info")
            .attr('role', 'progressbar')
            .attr('aria-valuemax', 100)
            .attr('aria-valuenow', 0)
            .attr('aria-valuein', 0)
            .width('0%');

        var progressBarPercent = $('<span class=sr-only />');
        progressBarPercent.text(fileSize);


        var progressCancel = $('<a href=# />');
        progressCancel.hide().addClass('progressCancel').text('');


        progressBar.append(progressBarPercent);
        progressBarWrapper.append(progressBar);
        progressBarBox.append(progressBarWrapper);
        progressBarBox.append(progressCancel);


        var progressBarStatus = $('<div class="status text-center"/>');
        progressBarBox.append(progressBarStatus);
        progressBarTd.append(progressBarBox);


        Wrappeer.append(progressText);
        Wrappeer.append(progressSize);
        Wrappeer.append(progressBarTd);

        $('#' + targetID).append(Wrappeer);
    } else {
        this.reset();
    }

    this.height = this.fileProgressWrapper.offset().top;
    this.setTimer(null);
}

FileProgress.prototype.setTimer = function(timer) {
    this.fileProgressWrapper.FP_TIMER = timer;
};

FileProgress.prototype.getTimer = function(timer) {
    return this.fileProgressWrapper.FP_TIMER || null;
};

FileProgress.prototype.reset = function() {
    this.fileProgressWrapper.attr('class', "progressContainer");
    this.fileProgressWrapper.find('td .progress .progress-bar-info').attr('aria-valuenow', 0).width('0%').find('span').text('');
    this.appear();
};

FileProgress.prototype.setChunkProgess = function(chunk_size) {
    var chunk_amount = Math.ceil(this.file.size / chunk_size);
    if (chunk_amount === 1) {
        return false;
    }

    var viewProgess = $('<button class="btn btn-default">查看分块上传进度</button>');

    var progressBarChunkTr = $('<tr class="chunk-status-tr"><td colspan=3></td></tr>');
    var progressBarChunk = $('<div/>');
    for (var i = 1; i <= chunk_amount; i++) {
        var col = $('<div class="col-md-2"/>');
        var progressBarWrapper = $('<div class="progress progress-striped"></div');

        var progressBar = $("<div/>");
        progressBar.addClass("progress-bar progress-bar-info text-left")
            .attr('role', 'progressbar')
            .attr('aria-valuemax', 100)
            .attr('aria-valuenow', 0)
            .attr('aria-valuein', 0)
            .width('0%')
            .attr('id', this.file.id + '_' + i)
            .text('');

        var progressBarStatus = $('<span/>');
        progressBarStatus.addClass('chunk-status').text();

        progressBarWrapper.append(progressBar);
        progressBarWrapper.append(progressBarStatus);

        col.append(progressBarWrapper);
        progressBarChunk.append(col);
    }
    this.fileProgressWrapper.find('td>div').append(viewProgess);

    progressBarChunkTr.hide().find('td').append(progressBarChunk);

    progressBarChunkTr.insertAfter(this.fileProgressWrapper);
};

FileProgress.prototype.setProgress = function(percentage, speed, chunk_size) {
    this.fileProgressWrapper.attr('class', "progressContainer green");

    var file = this.file;
    var uploaded = file.loaded;

    var size = plupload.formatSize(uploaded).toUpperCase();
    var formatSpeed = plupload.formatSize(speed).toUpperCase();
    var progressbar = this.fileProgressWrapper.find('td .progress').find('.progress-bar-info');
    this.fileProgressWrapper.find('.status').text("已上传: " + size + " 上传速度： " + formatSpeed + "/s");
    percentage = parseInt(percentage, 10);
    if (file.status !== plupload.DONE && percentage === 100) {
        percentage = 99;
    }
    progressbar.attr('aria-valuenow', percentage).css('width', percentage + '%');

    if (chunk_size) {
        var chunk_amount = Math.ceil(file.size / chunk_size);
        if (chunk_amount === 1) {
            return false;
        }
        var current_uploading_chunk = Math.ceil(uploaded / chunk_size);
        var pre_chunk, text;

        for (var index = 0; index < current_uploading_chunk; index++) {
            pre_chunk = $('#' + file.id + "_" + index);
            pre_chunk.width('100%').removeClass().addClass('alert-success').attr('aria-valuenow', 100);
            text = "块" + index + "上传进度100%";
            pre_chunk.next().html(text);
        }

        var currentProgessBar = $('#' + file.id + "_" + current_uploading_chunk);
        var current_chunk_percent;
        if (current_uploading_chunk < chunk_amount) {
            if (uploaded % chunk_size) {
                current_chunk_percent = ((uploaded % chunk_size) / chunk_size * 100).toFixed(2);
            } else {
                current_chunk_percent = 100;
                currentProgessBar.removeClass().addClass('alert-success');
            }
        } else {
            var last_chunk_size = file.size - chunk_size * (chunk_amount - 1);
            var left_file_size = file.size - uploaded;
            if (left_file_size % last_chunk_size) {
                current_chunk_percent = ((uploaded % chunk_size) / last_chunk_size * 100).toFixed(2);
            } else {
                current_chunk_percent = 100;
                currentProgessBar.removeClass().addClass('alert-success');
            }
        }
        currentProgessBar.width(current_chunk_percent + '%');
        currentProgessBar.attr('aria-valuenow', current_chunk_percent);
        text = "块" + current_uploading_chunk + "上传进度" + current_chunk_percent + '%';
        currentProgessBar.next().html(text);
    }

    this.appear();
};

FileProgress.prototype.setComplete = function(up, info) {

    var td = this.fileProgressWrapper.find('td:eq(2) .progress');
    var res = $.parseJSON(info);
    var url = res.url;
    var link = res.url;

    var persistentUrl = 'http://api.qiniu.com/status/get/prefop?id=' + res.persistentId;
    if (!res.url) {
        var domain = up.getOption('domain');
        url = domain + encodeURI(res.key);
        var link = domain + res.key;
    }
    str = "<div><strong>Link:</strong><a href=" + url + " target='_blank' > " + link + "</a></div>" +
        "<div class=hash><strong>Hash:</strong>" + res.hash + "</div>" +
        "<div class=process-status><strong>转码状态:</strong><a href=" + persistentUrl + " target='_blank' > " + '等待处理' + "</a></div>";
    td.html(str).removeClass().next().next('.status').hide();

    var progressNameTd = this.fileProgressWrapper.find('.progressName');

    var Wrapper = $('<div class="Wrapper"/>');
    var playBtn = $('<input class="origin-video btn  btn-primary play-btn" type="button" value="播放原视频">');
    playBtn.attr('data-url', url);
    var processedPlayBtn = $('<input class=" btn  btn-info play-btn" type="button"  style="display:none" value="播放转码后视频">');

    Wrapper.append(playBtn);
    Wrapper.append(processedPlayBtn);
    progressNameTd.append(Wrapper);
    $('table button.btn').hide().parents('tr').next().hide(); //隐藏进度按钮


    var processedLink = up.getOption('domain');
    timerId = setInterval(function() {
        statusUrl = 'pfop_status.php?id=' + res.persistentId;
        statusAnchor = td.find('.process-status a');

        $.ajax({
            url: statusUrl,
            async: false
        }).done(function(resp) {
            statusObj = JSON && JSON.parse(resp) || $.parseJSON(resp);
            item = statusObj.items[0]

            switch (item.code) {
                case 0:
                    statusAnchor.text('处理成功');
                    processedPlayBtn.show();
                    processedLink += encodeURIComponent(item.key);
                    processedPlayBtn.attr('data-url', processedLink);
                    clearInterval(timerId);
                    return;
                case 1:
                    statusAnchor.text('等待处理');
                    break;
                case 2:
                    statusAnchor.text('正在处理');
                    break;
                case 3:
                    statusAnchor.text('处理失败');
                    clearInterval(timerId);
                    break;
                case 4:
                    statusAnchor.text('通知失败');
                    clearInterval(timerId);
                    break;
            }
        });
    }, 5000); //5 seconds
};

FileProgress.prototype.setError = function() {
    this.fileProgressWrapper.find('td:eq(2)').attr('class', 'text-warning');
    this.fileProgressWrapper.find('td:eq(2) .progress').css('width', 0).hide();
    this.fileProgressWrapper.find('button').hide();
    this.fileProgressWrapper.next('.chunk-status-tr').hide();
};

FileProgress.prototype.setCancelled = function(manual) {
    var progressContainer = 'progressContainer';
    if (!manual) {
        progressContainer += ' red';
    }
    this.fileProgressWrapper.attr('class', progressContainer);
    this.fileProgressWrapper.find('td .progress .progress-bar-info').css('width', 0);
};

FileProgress.prototype.setStatus = function(status, isUploading) {
    if (!isUploading) {
        this.fileProgressWrapper.find('.status').text(status).attr('class', 'status text-left');
    }
};

FileProgress.prototype.appear = function() {
    if (this.getTimer() !== null) {
        clearTimeout(this.getTimer());
        this.setTimer(null);
    }

    if (this.fileProgressWrapper[0].filters) {
        try {
            this.fileProgressWrapper[0].filters.item("DXImageTransform.Microsoft.Alpha").opacity = 100;
        } catch (e) {
            // If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
            this.fileProgressWrapper.css('filter', "progid:DXImageTransform.Microsoft.Alpha(opacity=100)");
        }
    } else {
        this.fileProgressWrapper.css('opacity', 1);
    }

    this.fileProgressWrapper.css('height', '');

    this.height = this.fileProgressWrapper.offset().top;
    this.opacity = 100;
    this.fileProgressWrapper.show();

};
