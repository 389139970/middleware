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
var logger = log4js.getLogger('peer');
var weight = 0;
var tracker_host = '127.0.0.1:3001';
var port = 3000;

var oneSecond = 1000 * 1; // one second = 1000 x 1 ms
setInterval(() => {
    generate();
}, oneSecond);

function getfiles(filePath) {
    return fs.readdirSync(filePath);
}
function getTime() {
    return new Date().toLocaleString();
}
server.listen(0, () => {
    port = server.address().port;
    console.log("listening at : %s", port);
    //generate();
});

function generate() {
    var arr = getfiles('./resource');
    var ret = { port: port, file: arr, weight: weight };
    request('http://' + tracker_host + '/refresh?data=' + encodeURIComponent(JSON.stringify(ret)), (err, res, body) => {
        if (err) {
            console.log(err);
        }
    });
}

function getClientIp(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return ip.replace('::ffff:', '');
};

app.get('/*.ts', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    logger.debug('request', req.path + ' from ' + getClientIp(req));
    weight += 1;
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

app.get('/download', (req, res) => {
    var _uri = req.query.uri;
    var _file = req.query.file;
    if (_file == undefined)
        _file = guessFilenameFromUri(_uri);
    if (!fs.existsSync('./resource/' + _file)) {
        request(_uri).pipe(fs.createWriteStream('./resource/' + _file));
        logger.debug("download:", "[" + _file + "] from " + _uri);
    }
    res.end();
});
//app.use(express.static('resource'));
app.use(express.static('html'));