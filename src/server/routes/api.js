var bitcannon = require('../../bitcannon/bitcannon');
var express = require('express');
var router = express.Router();

router.endpoints = ['/browse','/stats'];

/* GET home page. */
router.get(router.endpoints[0], function(req, res, next) {
    res.render('layout', { title: 'Express' });
});

router.get(router.endpoints[1], function(req, res, next) {
    res.render('layout', { title: 'Express' });
});

module.exports = router;
