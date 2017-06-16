# middleware使用说明 #

>middleware是一个基于video.js实现的hls中间件模型，peer端在接收hls的切片数据后可直接为下一个peer进行服务。由tracker端进行协调调度。默认给出了基于weight调度(ref:iaeac2017.240142)和随机调度两种模型，用户可以自行添加。

## tracker ##

tracker端是协调器，主要用于协调各个peer节点转发以及提供第一份资料发布。

### 安装 ###

首先，该程序是全平台通用。您必须下载并安装node.js(http://nodejs.cn/)，安装步骤略。
安装完毕后，cd到tracker目录，并用以下命令行安装：
```
npm install
```
如果安装完毕，将会出现一个node_modules文件夹，随后在统一目录用以下命令行开启服务：
```
node server.js
```
*windows用户可以直接双击当前目录下的**start.bat**运行服务。*

### 运行 ###

如果一切顺利，你将看到以下情形：
>listening at: 3001

出现以上情形则表明服务器顺利开启，tracker服务开启在3001端口。

## peer ##

peer端是节点，主要用于接收上一个peer发来的信息以及转发给下一个peer。

### 安装 ###

安装方法与tracker相同。

### 转发原理 ###

一般播放hls的流程大致为:
```
下载m3u8索引文件->
根据文件下载ts文件->
播放ts文件->
结束。
```

由于video.js插件的帮助，我们可以获取到**根据文件下载ts文件**这一步之前的一步，也就是**beforerequest**。所以我们的流程将变成：
```
下载m3u8索引文件->
----------------------------------
获取要下载的ts文件名->
将文件名提交tracker->
获取tracker分配的节点文件名->
替换原先下载的ts文件名->
----------------------------------
根据文件下载ts文件->
播放ts文件->
结束。
```

倘若用代码表示以上黑体字的话，在peer的/html/js/core.js中
```js
player.tech({ IWillNotUseThisInPlugins: true }).hls.xhr.beforeRequest = function (options) {
    //访问tracker获取真实分配的节点文件名
    $.get('http://localhost:3001/geturi?uri=' + options.uri, function (data) {
        //保存到本地，供tracker进行协调
        $.get('/download?uri=' + data.uri, function (ret) {
            if (ret)
                console.log(ret);
        });
        console.log(options.uri + '->' + data.uri);
        //替换本来将要访问的文件名
        options.uri = data.uri;
        return options;
    });
};
```

## 二次开发 ##

二次开发主要在tracker端的server.js中。
peer端每一秒发送心跳包，内容包括**端口号，当前所有文件名，权重**。
tracker端每三秒处理一次peer端清理，删除心跳包超时的peer端。
tracker端分配节点主要由函数corecal完成，位于server.js中：
```js
function corecal(requestfilename) {
    var _host = '';
    var _hostarr = [];//有文件名的主机数组
    //遍历生成主机数组
    map.forEach((t) => {
        var files = t.file;
        files.forEach((file) => {
            if (file == requestfilename) {
                _hostarr.push(t.hostname);
            }
        });
    });
    //默认随机给出一个节点的文件名。
    var _index = Math.floor(GetRandomNum(_hostarr.length));
    _host = _hostarr[_index];
    logger.debug('redirect', getTime(), requestfilename + '->' + _host);
    return _host;
}
```
此外，注释给出了一个基于熵权法权重选择节点的方法，基于我的论文(iaeac2017,240142)中发表的算法。

## 日志查看 ##

日志位于目录下的default.log中，使用普通的记事本就可打开。
```
[2017-06-16 20:32:42.914] [DEBUG] tracker - request /hi.m3u8 from ::1
[2017-06-16 20:32:43.000] [DEBUG] tracker - redirect LipReading_640_360_00000.ts -> 127.0.0.1:3001
[2017-06-16 20:32:43.039] [DEBUG] tracker - request /LipReading_640_360_00000.ts from 127.0.0.1
[2017-06-16 20:32:43.196] [DEBUG] tracker - redirect LipReading_640_360_00001.ts -> 127.0.0.1:58089
[2017-06-16 20:32:43.392] [DEBUG] tracker - redirect LipReading_640_360_00002.ts -> 127.0.0.1:58089
[2017-06-16 20:32:45.984] [DEBUG] tracker - redirect LipReading_640_360_00003.ts -> 127.0.0.1:58089
```

主要有以下几个关键词

### redirect ###

tracker服务器选择节点后的日志输出，格式为 文件名->服务器。例：
```
[2017-06-16 20:32:43.196] [DEBUG] tracker - redirect LipReading_640_360_00001.ts -> 127.0.0.1:58089
```

### request ###

tracker服务器和peer服务器被请求资源时的日志输出，格式为 文件名 from 请求者ip，例：
```
[2017-06-16 20:32:43.039] [DEBUG] tracker - request /LipReading_640_360_00000.ts from 127.0.0.1
[2017-06-16 20:32:43.214] [DEBUG] peer - request /LipReading_640_360_00001.ts from 127.0.0.1
```

**IP有时以ipv6的方式表达。**

### remove ###

tracker服务器在删除某个心跳过期节点时的日志输出，格式为 服务器，例：
```
[2017-06-16 20:32:43.049] [DEBUG] tracker - remove 127.0.0.1:58089
```

### download ###

peer服务器将视频文件保存到本地时的日志输出，格式为 [文件名] from 文件地址，例：
```
[2017-06-16 20:32:37.396] [DEBUG] peer - download: [LipReading_640_360_00003.ts] from http://127.0.0.1:3001/LipReading_640_360_00003.ts
```
