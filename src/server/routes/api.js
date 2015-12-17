var bitcannon = require('../../bitcannon/bitcannon');
var express = require('express');
var router = express.Router();

router.endpoints = [
    '/browse',
    '/stats',
    '/browse/:category',
    '/torrent/:btih',
    '/search/:query',
    '/search/:query/s/:skip',
    '/search/:query/c/:category',
    '/search/:query/c/:category/s/:skip',
    '/scrape/:btih'
];

var api = require('../../bitcannon/api');

router.get('/', function (req, res, next) {
   api.unsupported(req,res, function () {
       res.json({status: 'OK'});
   });
});

router.get('/stats', function (req, res, next) {
    api.unsupported(req,res, function () {
        res.json({
            "Count": 11019460,
            "Trackers": [
                "udp://open.demonii.com:1337",
                "udp://tracker.istole.it:80",
                "udp://tracker.openbittorrent.com:80",
                "udp://tracker.publicbt.com:80",
                "udp://tracker.coppersurfer.tk:6969",
                "udp://tracker.leechers-paradise.org:6969",
                "udp://exodus.desync.com:6969"
            ]
        });
    });
});

router.get('/browse', function (req, res, next) {
    api.unsupported(req,res, function () {
        res.json([
            {
                "count": 247869,
                "name": "Movies"
            },
            {
                "count": 172654,
                "name": "Music"
            },
            {
                "count": 33,
                "name": "Music Videos"
            },
            {
                "count": 169388,
                "name": "Other"
            }
        ]);
    });
});

router.get('/browse/:category', function(req, res, next) {
    api.unsupported(req,res, function () {
        res.json([{
                "Btih": "Btih1",
                "Category": "Movies",
                "Details": [
                    "http://example.com"
                ],
                "Imported": "2015-04-02T13:15:24.943+01:00",
                "Lastmod": "2015-04-03T18:52:29.186+01:00",
                "Size": 0,
                "Swarm": {
                    "Leechers": 2598,
                    "Seeders": 1781
                },
                "Title": "Example Torrent 1"
            },
            {
                "Btih": "Btih2",
                "Category": "Movies",
                "Details": [
                    "http://example.com"
                ],
                "Imported": "2015-03-30T03:54:12.647+01:00",
                "Lastmod": "2015-04-04T00:19:23.645+01:00",
                "Size": 0,
                "Swarm": {
                    "Leechers": 316,
                    "Seeders": 1776
                },
                "Title": "Example Torrent 2"
            },
            {
                "Btih": "Btih3",
                "Category": "Movies",
                "Details": [
                    "http://example.com"
                ],
                "Imported": "2015-03-30T03:50:43.069+01:00",
                "Lastmod": "2015-04-03T22:59:08.231+01:00",
                "Size": 0,
                "Swarm": {
                    "Leechers": 410,
                    "Seeders": 1773
                },
                "Title": "Example Torrent 3"
            }
        ]);
    });
});

router.get(['/browse/torrent/:btih','/torrent/:btih'], function(req, res, next) {
    api.unsupported(req, res, function () {
        res.json({
            "Btih": "Btih1",
            "Category": "Games PC",
            "Details": [
                "http://example.com"
            ],
            "Imported": "2015-12-17T01:21:38.748Z",
            "Lastmod": "2015-12-17T01:22:08.721Z",
            "Size": 0,
            "Swarm": {
                "Leechers": 4,
                "Seeders": 5
            },
            "Title": "Example Torrent 1"
        });
    });
});

router.get('/scrape/:btih', function(req, res, next) {
    api.unsupported(req, res, function() {
        res.json({
            "Lastmod": "2015-12-17T01:30:32.185731072Z",
            "Swarm": {
                "Leechers": 4,
                "Seeders": 6
            }
        });
    });
});

router.get('/search/:query', function(req, res, next) {

});

router.get('/search/:query/s/:skip', function(req, res, next) {

});

router.get('/search/:query/c/:category', function(req, res, next) {

});

router.get('/search/:query/c/:category/s/:skip', function(req, res, next) {

});

//Catch all
router.get(/^(.*)$/, function(req, res, next){
    //All routers must call api.unsupported with a callback function in order to verify if the API version trying to be used is valid
    api.unsupported(req,res,function() {
        res.send(404); //If the version number is okay we send a 404 Not Found because the resource requested does not exist
    });
});



module.exports = router;
