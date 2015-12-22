"use strict";
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
        let limit = 200;
        bitcannon.database.get.category(req.params.category,limit,function(err,torrents) {
            /*
            To Do
                * Find a better way of doing this - calling String.replace multiple times on a large set of results could be expensive
                    * Perhaps break the API by outputting the JSON keys in lowercase
                    * This would mean going straight to version 2.0 of the API in accordance with semantic versioning (http://semver.org)
                    * Another option would be to go to version 1.1 of the API but keep compatibility with version 1.0
             */
            torrents = JSON.stringify(torrents)
                .replace(new RegExp('"_id":','g'),'"Btih":')
                .replace(new RegExp('"category":','g'),'"Category":')
                .replace(new RegExp('"details":','g'),'"Details":')
                .replace(new RegExp('"imported":','g'),'"Imported":')
                .replace(new RegExp('"lastmod":','g'),'"Lastmod":')
                .replace(new RegExp('"size":','g'),'"Size":')
                .replace(new RegExp('"swarm":','g'),'"Swarm":')
                .replace(new RegExp('"leechers":','g'),'"Leechers":')
                .replace(new RegExp('"seeders":','g'),'"Seeders":')
                .replace(new RegExp('"title":','g'),'"Title":');
                if(err) {
                    res.status(500).send();
                } else {
                    res.json(JSON.parse(torrents));
                }
        });
    });
});

router.get(['/browse/torrent/:btih','/torrent/:btih'], function(req, res, next) {
    api.unsupported(req, res, next, function () {
        bitcannon.database.get.torrent(req.params.btih,function(err,torrent) {
            /*
            To Do
                * As with /browse/:category need to find a better way of doing this.
             */
            torrent = JSON.stringify(torrent)
                .replace(new RegExp('"_id":','g'),'"Btih":')
                .replace(new RegExp('"category":','g'),'"Category":')
                .replace(new RegExp('"details":','g'),'"Details":')
                .replace(new RegExp('"imported":','g'),'"Imported":')
                .replace(new RegExp('"lastmod":','g'),'"Lastmod":')
                .replace(new RegExp('"size":','g'),'"Size":')
                .replace(new RegExp('"swarm":','g'),'"Swarm":')
                .replace(new RegExp('"leechers":','g'),'"Leechers":')
                .replace(new RegExp('"seeders":','g'),'"Seeders":')
                .replace(new RegExp('"title":','g'),'"Title":');
                if(err) {
                    return res.status(500).send();
                } else {
                    return res.json(JSON.parse(torrent));
                }
        });
    });
});

router.get('/scrape/:btih', function(req, res, next) {
    api.unsupported(req, res, next, function() {
        //If the id exists, i.e it is in the database
        bitcannon.database.exists(req.params.btih,function(err,torrent) {
            if(err) {
                return res.status(500).send();
            }
            if(torrent) {
                bitcannon.scrape(req.params.btih, function (err, swarm) {
                    res.json({
                        "Lastmod": ((torrent[0].swarm.leechers !== swarm.Leechers || torrent[0].swarm.seeders !== swarm.Seeders) ? new Date().toISOString() : torrent[0].lastmod),
                        "Swarm": {
                            "Leechers": swarm.Leechers,
                            "Seeders": swarm.Seeders
                        }
                    });

                    var record = torrent[0].toObject();
                    let recordID = String(torrent[0]._id);
                    delete record._id;

                    //Modify leechers
                    if(torrent[0].swarm.leechers !== swarm.Leechers) {
                        bitcannon.log('Updating Leechers...');
                        record.swarm.leechers = swarm.Leechers;
                        record.lastmod = new Date().toISOString();
                        bitcannon.database.update.record(recordID,record);
                    }
                    //Modify seeders
                    if(torrent[0].swarm.seeders !== swarm.Seeders) {
                        bitcannon.log('Updating Seeders...');
                        record.swarm.seeders = swarm.Seeders;
                        record.lastmod = new Date().toISOString();
                        bitcannon.database.update.record(recordID,record);
                    }
                });
            } else {
                return res.status(404).send();
            }
        });
    });
});

router.get(['/search/:query','/search/:query/s/:skip','/search/:query/c/:category','/search/:query/c/:category/s/:skip'], function(req, res, next) {
    req.params.skip = (req.params.skip === undefined) ? 0 : parseInt(req.params.skip);
    api.unsupported(req, res, next, function(){
        bitcannon.database.get.search(req.params.query,req.params.category,req.params.skip,function(err,torrents) {
           if(err) {
               res.status(500).send();
           } else {
               if(torrents.length === 0) {
                   return res.status(404).type('json').send("{\"error\": \"" + "No results found for " + req.params.query + "\"}");
               }
               torrents = JSON.stringify(torrents)
                   .replace(new RegExp('"_id":','g'),'"Btih":')
                   .replace(new RegExp('"category":','g'),'"Category":')
                   .replace(new RegExp('"details":','g'),'"Details":')
                   .replace(new RegExp('"imported":','g'),'"Imported":')
                   .replace(new RegExp('"lastmod":','g'),'"Lastmod":')
                   .replace(new RegExp('"size":','g'),'"Size":')
                   .replace(new RegExp('"swarm":','g'),'"Swarm":')
                   .replace(new RegExp('"leechers":','g'),'"Leechers":')
                   .replace(new RegExp('"seeders":','g'),'"Seeders":')
                   .replace(new RegExp('"title":','g'),'"Title":');
               return res.json(JSON.parse(torrents));
           }
        });
    });
});

//Catch all
router.get(/^(.*)$/, function(req, res, next){
    //All routers must call api.unsupported with a callback function in order to verify if the API version trying to be used is valid
    api.unsupported(req, res, next, function() {
        return res.status(404).type('json').send("{\"error\": \"" + require('../statuses')[404] + "\"}"); //If the version number is okay we send a 404 Not Found because the resource requested does not exist
    });
});

module.exports = router;
