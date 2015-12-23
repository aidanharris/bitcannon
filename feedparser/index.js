var fs = require('fs');
var parseString = require('xml2js').parseString;

var request = require('request');
//require('request-debug')(request);

var zlib = require('zlib');

function getGZipped(req, callback) {
    var gunzip = zlib.createGunzip();
    req.pipe(gunzip);

    var buffer  = [];
    gunzip.on('data', function (data) {
        // decompression chunk ready, add it to the buffer
        buffer.push(data);
    }).on('end', function () {
        //response and decompression complete, join the buffer and return
        callback(null, JSON.parse(buffer));
    }).on('error', function (e) {
        callback(e);
    });
}

function gunzip(body,callback) {
    var buffer = new Buffer(body,'base64');
    zlib.unzip(buffer, function(err, buffer) {
        if (!err) {
            callback(err,buffer.toString());
        } else {
            console.warn(err);
        }
    });
}

function parse(body) {
    parseString(body, function(err, result) {
        if(err) {
            console.warn(err);
            throw err;
        }
        var xmlns = '';
        var torrentTag = false;
        var torrentNameSpace = false;
        try {
            xmlns = result.rss.channel[0].torrent[0].$.xmlns; //<torrent xmlns="http://xmlns.ezrss.it/0.1/"><infoHash>...</infoHash></torrent>
            torrentTag = true;
        } catch (err) {
            try {
                xmlns = result.rss.$['xmlns:torrent']; //<rss xmlns:torrent="http://xmlns.ezrss.it/0.1/"><torrent:infoHash>...</torrent:infoHash></rss>
                torrentNameSpace = true;
            } catch (err) {
                xmlns = result.rss.$['xmlns:atom']; //<rss xmlns:atom="http://www.w3.org/2005/Atom">...<enclosure url="http://example.com/example.torrent" type="application/x-bittorrent" length="10000"/>...</rss>
            }
        }
        console.log(result.rss.channel[0]);
        console.log('xmlns: ' + xmlns);
        console.log(result.rss.channel[0].item.length);
    });
}

request({
    "uri": "URL TO PARSE",
    "headers": {
        "User-Agent": "BitCannon (http://bitcannon.io)",
        "accept-encoding": "gzip"
    },
    "encoding": null,
    "method": "GET",
    "timeout": 10000,
    "followRedirect": false,
    "maxRedirects": 10,
    "removeRefererHeader": true
}, function(error, response, body) {
    if(error) {
        console.warn(error);
        throw error;
    }
    switch (response.headers['content-encoding']) {
        case 'gzip':
            gunzip(body,function(err,body) {
                parse(err,body);
            });
            break;
        default:
            parse(err,body);
            break;
    }
});