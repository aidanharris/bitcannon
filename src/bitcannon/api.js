'use strict';

module.exports = (function () {
  // The latest API version
  const LATEST_API = 1.0;

  // Old versions of the API we no longer support
  // - these need to get sent a HTTP 410 - Gone
  // header along with a message to update to the latest API
  const LEGACY_VERSIONS = 0.9;

  return {
    unsupported(req, res, next, callback) {
      // Get the api version number used & convert it to a floating point number
      req.apiVersion = parseFloat(
        req.baseUrl.split('/')[2]
          .substr(1, req.baseUrl.split('/')[2].length)
      );
      // If it's less than or equal to legacyVersions we send a HTTP 410 'Gone'
      // error along with a message explaining that a deprecated API is used
      if (req.apiVersion <= LEGACY_VERSIONS) {
        return res.status(410).type('json').json({
          error:
          'You are trying to use a deprecated version of the BitCannon API!' +
          ' Please upgrade to the latest version ' +
          '(see https://github.com/aidanharris/bitcannon/wiki/API)' });
      }
      // If it's greater than the current api version we send a HTTP 400
      // 'Bad Request' error because the API version does not exist
      if (req.apiVersion > LATEST_API) {
        return res.status(400).type('json')
          .json({ error: require('../server/node_modules/statuses')[400] });
      }
      // Else everything is fine so we run the callback function
      return callback(req, res, next);
    },
  };
})();
