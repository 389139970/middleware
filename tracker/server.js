var os = require('os');
var request = require('request');
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var fs = require('fs');
var log4js = require('log4js');
log4js.configure({
    appenders: [{
        type: 'file',
        filename: 'default.log'
    }]
})
var logger = log4js.getLogger('tracker');
var weight = 0;
var port = 3000;
var HashMap = require('hashmap');
var map = new HashMap();
var weightmap = {};
var oneSecond = 1000 * 1; // one second = 1000 x 1 ms
//testok
setInterval(() => {
    var _now = new Date().getTime();
    map.forEach((t) => {
        var delay = _now - t.date;
        if (delay > 5000) {//>5s
            logger.debug('remove', t.hostname);
            map.remove(t.hostname);
            weightmap[t.hostname] = null;
        }
    });
}, oneSecond * 3);  //3

setInterval(() => {
    generate();
    var _debugstr = '';
    map.forEach((t) => {
        var _weight = t.weight;
        var _realweight = 0;
        if (weightmap[t.hostname] != null) {
            _realweight = weightmap[t.hostname];
        }
        _debugstr += t.hostname + '.weight -> ' + _weight + ' + ' + _realweight + ' ';
    });
    //logger.debug('interval',getTime(),  _debugstr);
}, oneSecond);  //3

function getfiles(filePath) {
    return fs.readdirSync(filePath);
}
function getTime() {
    return new Date().toLocaleString();
}
server.listen(3001, () => {
    port = server.address().port;
    console.log("listening at : %s", port);
    generate();
});

function getClientIp(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return ip.replace('::ffff:', '');
};
function getExtensions(file) {
    var ptr = file.split('.');
    if (ptr.length > 0) {
        return ptr[ptr.length - 1];
    } else {
        return '';
    }
}

app.get('/getm3u8', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    var ret = [];
    var arr = getfiles('./resource');
    arr.forEach((t) => {
        if (getExtensions(t) == 'm3u8') {
            ret.push(t);
        }
    });
    res.send(ret);
});
app.get('/refresh', (req, res) => {
    /*
    may be like this
    [port:"8001",file:{"xxx.ts","222.ts","3333.ts"},weight:0];
    */
    var data = JSON.parse(decodeURIComponent(req.query.data));
    var host = getClientIp(req) + ':' + data.port;
    var _weight = data.weight;
    //logger.debug('refresh', host + "," + _weight);
    var tmp = { hostname: host, file: data.file, weight: _weight, date: new Date().getTime() };
    map.set(host, tmp);
    res.end();
});
function generate() {
    var arr = getfiles('./resource');
    var ret = { port: port, file: arr, weight: weight };
    request('http://localhost:' + port + '/refresh?data=' + encodeURIComponent(JSON.stringify(ret)), (err, res, body) => {
        if (err) {
            console.log(err);
        }
    });
}
function GetRandomNum(Num) {
    return Math.random() * Num;
}
function corecal(requestfilename) {
    //var _weight = 99999999;
    var _host = '';
    var _hostarr = [];
    map.forEach((t) => {
        var files = t.file;
        files.forEach((file) => {
            if (file == requestfilename) {
                /*
                console.log(file, t.hostname);
                var _realweight = t.weight;
                //add weight
                if (weightmap[t.hostname] != null) {
                    _realweight += weightmap[t.hostname];
                }
                if (_realweight < _weight) {
                    _weight = _realweight;
                    _host = t.hostname;
                }
                */
                _hostarr.push(t.hostname);
            }
        });
    });
    //this is only for a test
    var _index = Math.floor(GetRandomNum(_hostarr.length));
    _host = _hostarr[_index];
    /*
    if (weightmap[_host] != null) {
        weightmap[_host] += 0.5;
    } else {
        weightmap[_host] = 0.5;
    }
    */
    logger.debug('redirect', requestfilename + ' -> ' + _host);
    return _host;
}

app.get('/*.ts', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    logger.debug('request', req.path + ' from ' + getClientIp(req));
    weight += 1;
    res.sendfile('./resource' + req.path);
    generate();
});

app.get('/*.m3u8', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    logger.debug('request', req.path + ' from ' + getClientIp(req));
    res.sendfile('./resource' + req.path);
    generate();
});

function guessFilenameFromUri(uri) {
    var arr = uri.split('/');
    if (arr.length > 0) {
        return arr[arr.length - 1];
    } else {
        return 'undefined';
    }
}

app.get('/geturi', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    var uri = req.query.uri;
    if (uri != null) {
        var _realuri = guessFilenameFromUri(uri);
        res.send({ uri: 'http://' + corecal(_realuri) + '/' + _realuri });
    } else {
        res.end();
    }
});