var bitcannon = require('../../bitcannon')();
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
   api.unsupported(req, res, next, function () {
       res.json({status: 'OK'});
   });
});

router.get('/stats', function (req, res, next) {
    api.unsupported(req, res, next, function () {
        bitcannon.database.get.stats(function(err, count){
            if(err) {
                res.status(500).send();
            } else {
                res.json({
                    "Count": count,
                    "Trackers": bitcannon.config.trackers()
                });
            }
        });
    });
});

router.get('/browse', function (req, res, next) {
    api.unsupported(req, res, next, function () {
        bitcannon.database.get.categories(function(err, categories){
            if(err) {
                res.status(500).send();
            } else {
                res.json(categories);
            }
        });
    });
});

router.get('/browse/:category', function(req, res, next) {
    api.unsupported(req, res, next, function () {
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
    api.unsupported(req, res, next, function () {
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
    api.unsupported(req, res, next, function() {
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
    api.unsupported(req, res, next, function() {
        res.status(404).send(); //If the version number is okay we send a 404 Not Found because the resource requested does not exist
    });
});



module.exports = router;
