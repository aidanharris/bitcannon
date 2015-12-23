"use strict";

var bitcannon = require('./bitcannon')();
module.exports = function() {
    var latestApi = 1.0; //The latest API version
    var legacyVersions = 0.9; //Old versions of the API we no longer support - these need to get sent a HTTP 410 - Gone header along with a message to update to the latest API

    function unsupported(req, res, next, callback) {
        //Get the api version number used and convert it to a floating point number
        req.apiVersion = parseFloat(req.baseUrl.split('/')[2].substr(1,req.baseUrl.split('/')[2].length));
        //If it's less than or equal to legacyVersions we send a HTTP 410 'Gone' error along with a message explaining that a deprecated API is being used
        if (req.apiVersion <= legacyVersions) {
            return res.status(410).send({"error": "You are trying to use a deprecated version of the BitCannon API! Please upgrade to the latest version (see https://github.com/aidanharris/bitcannon/wiki/API)"});
        }
        //If it's greater than the current api version we send a HTTP 400 'Bad Request' error because the API version does not exist
        else if(req.apiVersion > latestApi) {
            return res.status(400).type('json').send("{\"error\": \"" + require('../server/node_modules/statuses')[400] + "\"}");
        }
        //Else everything is fine so we run the callback function
        else {
            return callback(req, res, next);
        }
    }

    return {
        unsupported: unsupported
    };
}();