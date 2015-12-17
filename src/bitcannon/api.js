module.exports = function() {
    var latestApi = 1.0; //The latest API version
    var legacyVersions = 0.9; //Old versions of the API we no longer support - these need to get sent a HTTP 410 - Gone header along with a message to update to the latest API

    function unsupported(req, res, next) {
        //Get the api version number used and convert it to a floating point number
        req.apiVersion = parseFloat(req.baseUrl.split('/')[2].substr(1,req.baseUrl.split('/')[2].length));
        //If it's less than or equal to router.legacyVersions we send a HTTP 410 Gone error along with a message explaining that a deprecated API is being used
        if (req.apiVersion <= legacyVersions) {
            res.status(410).send({error: 'You are trying to use a deprecated version of the BitCannon API! Please upgrade to the latest version (see http://example.com/docs/api)'})
        }
        //If it's greater than the current api version we send a HTTP 404 Not Found error because the API does not exist
        else if(req.apiVersion > latestApi) {
            res.sendStatus(404);
        }
        //Else everything is fine so we run the callback function
        else {
            next(req, res, next);
        }
    }

    return {
        unsupported: unsupported
    }
}();