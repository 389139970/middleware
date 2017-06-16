var player = null;
function guessFilenameFromUri(uri) {
    var arr = uri.split('/');
    if (arr.length > 0) {
        return arr[arr.length - 1];
    } else {
        return 'undefined';
    }
}
function downloadm3u8(filename) {
    $.ajaxSetup({
        async: false
    });
    console.log(filename);
    if (player == null) {
        $('#videonow').append("<video id=\"example-video\" width=\"800\" height=\"480\" class=\"video-js vjs-default-skin\" controls></video>");
        player = videojs("example-video", {
            html5: {
                hls: {
                    //not use allow access
                    withCredentials: false
                }
            }
        });
    }else{
        player.pause();
    }
    player.src({
        src: 'http://localhost:3001/' + filename,
        type: 'application/x-mpegURL',
    });

    player.tech({ IWillNotUseThisInPlugins: true }).hls.xhr.beforeRequest = function (options) {
        $.get('http://localhost:3001/geturi?uri=' + options.uri, function (data) {
            $.get('/download?uri=' + data.uri, function (ret) {
                if (ret)
                    console.log(ret);
            });
            console.log(options.uri + '->' + data.uri);
            options.uri = data.uri;
            return options;
        });
    };
    
    player.play();
}
$.get('http://localhost:3001/getm3u8', function (data) {
    data.forEach(function (element) {
        var str = "<button type=\"button\" onclick = \"downloadm3u8('" + element + "')\" class=\"btn btn-default btn-lg \">" + element + "</button>";
        $('#buttonnow').append(str);
    }, this);
});