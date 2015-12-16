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

/* GET home page. */
router.get(router.endpoints[0], function(req, res, next) {
    res.render('layout', { title: 'Express' });
});

router.get(router.endpoints[1], function(req, res, next) {
    res.render('layout', { title: 'Express' });
});

module.exports = router;
