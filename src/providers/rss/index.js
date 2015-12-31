'use strict';

const parseString = require('xml2js').parseString;

const parseTorrent = require(
  '../../bitcannon/node_modules/parse-torrent'
);

const request = require('request');

const zlib = require('zlib');

/*
 @params:
 rssFeed:
  The RSS feed to parse
 category:
  category override to override the category in the rss feed or
  specify one if the feed doesn't contain categories (If one isn't specified
  the default 'Other' is used)
 callback:
  callback called once a feed item has been parsed - The callback should be
  used to update the database.
*/
module.exports = function (feedURL, category, callback) {
  const bitcannon = require('../../bitcannon/bitcannon-core')();
  if (bitcannon.config.debugLevel() > 2) {
    require('request-debug')(request);
  }
  function gunzip(body, callback) {
    const buffer = new Buffer(body, 'base64');
    zlib.unzip(buffer, function (err, buffer) {
      if (!err) {
        callback(err, buffer.toString());
      } else {
        bitcannon.error(err);
        throw err;
      }
    });
  }

  function parse(err, body, feedURL, callback) {
    let numberOfItemsParsed = 0;
    function getTorrentInfo(url, struct) {
      if (url.indexOf('http') === 0 || url.indexOf('magnet:') === 0) {
        parseTorrent.remote(url,
          function (err, parsedTorrent) {
            if (err) {
              bitcannon.error(err);
              bitcannon.log('An error has occurred processing the following' +
                ' torrent:');
              bitcannon.log(url);
              bitcannon.log('This could mean either the file is damaged or' +
                ' there is a problem with your network connection');
              bitcannon.log('Is your Internet connection working?');
              bitcannon.log('Does your ISP block or censor?');
              bitcannon.log('Do you have any security software such as a ' +
                'firewall or anti-virus?');
              return;
            }
            if (struct.size === 0) {
              struct.size = parsedTorrent.length;
            }
            struct._id = parsedTorrent.infoHash.toUpperCase();
            bitcannon.scrape(struct._id, function (err, swarm) {
              struct.swarm.leechers = (struct.swarm.leechers === -1) ? 0
                  : swarm.Leechers;
              struct.swarm.seeders = (struct.swarm.seeders === -1) ? 0
                  : swarm.Seeders;
              return callback(err, struct);
            });
          }
        );
      } else {
        return bitcannon.scrape(struct._id, function (err, swarm) {
          struct.swarm.leechers = (struct.swarm.leechers === -1) ? 0
              : swarm.Leechers;
          struct.swarm.seeders = (struct.swarm.seeders === -1) ? 0
              : swarm.Seeders;
          return callback(err, struct);
        });
      }
    }

    parseString(body, function (err, result) {
      const totalNumberOfItems = result.rss.channel[0].item.length;
      let torrentTag = false;
      let torrentNameSpace = false;
      let atomFeed = false;
      let rssFeed = false;
      let namespace = '';
      let torrent;
      let item;
      const torrentTags = [
        'contentLength',
        'infoHash',
        'seeds',
        'peers',
      ];

      if (err) {
        bitcannon.error(err);
        throw err;
      }
      if (result.hasOwnProperty('rss')) {
        rssFeed = true;
      }
      try {
        if (typeof(result.rss.channel[0].torrent[0].$.xmlns) !== 'undefined') {
          // <torrent xmlns="http://xmlns.ezrss.it/0.1/">
          //    <infoHash>...</infoHash>
          // </torrent>
          torrentTag = true;
        }
      } catch (err) {
        try {
          if (typeof(result.rss.$['xmlns:torrent']) !== 'undefined') {
            // <rss xmlns:torrent="http://xmlns.ezrss.it/0.1/">
            //    <torrent:infoHash>...</torrent:infoHash>
            // </rss>
            torrentNameSpace = true;
          } else {
            throw err;
          }
        } catch (err) {
          try {
            if (typeof(result.rss.$['xmlns:atom']) !== 'undefined') {
              // <rss xmlns:atom="http://www.w3.org/2005/Atom">
              //    ...
              //    <enclosure url="http://example.com/example.torrent"
              //               type="application/x-bittorrent"
              //               length="10000"
              //    />
              //    ...
              // </rss>
              atomFeed = true;
            } else {
              throw err;
            }
          } catch (err) {
            if (!rssFeed) {
              bitcannon.error('This isn\'t an RSS feed!');
              bitcannon.error('If you think this is a mistake' +
                ' please file an issue (' +
                'https://github.com/aidanharris/bitcannon/issues)');
              throw err;
            }
          }
        }
      }

      if (torrentNameSpace) {
        namespace = 'torrent:';
        torrent = result.rss.channel[0].item;
      } else if (torrentTag) {
        torrent = result.rss.channel[0].torrent;
        item = result.rss.channel[0].item;
      } else {
        bitcannon.log('Parsing plain RSS or Atom feed');
        bitcannon.log('BitCannon works best with feeds ' +
          'that use the torrent format but we\'ll try our best!');
        item = result.rss.channel[0].item;
        torrent = result.rss.channel[0].item;
      }

      for (let i = 0, struct = bitcannon.providers.torrentStruct();
           i < result.rss.channel[0].item.length; i++) {
        struct.category = String(
          category ||
          torrent[i].category ||
          item[i].category ||
          'Other');

        struct.title = String(
          torrent[i].title ||
          item[i].title);

        struct.details =
          torrent[i].link ||
          item[i].link ||
          torrent[i].guid ||
          item[i].guid || '';

        if (typeof(struct.details) !== 'object') {
          struct.details = new Array(struct.details);
        }

        if (torrentNameSpace || torrentTag) {
          // Iterate over the torrentTags array
          for (let j = 0; j < torrentTags.length; j++) {
            switch (torrentTags[j]) {
              case 'seeds':
                // If the feed doesn't contain info on seeders we set it to 0
                struct.swarm.seeders =
                  (typeof(torrent[i][namespace + torrentTags[j]]) ===
                  'undefined') ? 0 : Number(torrent[i][namespace + torrentTags[j]]);
                break;
              // If the feed doesn't contain info on leechers we set it to 0
              case 'peers':
                struct.swarm.leechers =
                  (typeof(torrent[i][namespace + torrentTags[j]]) ===
                  'undefined') ? 0 :
                    Number(torrent[i][namespace + torrentTags[j]]);
                break;
              // Set the id to the infoHash
              case 'infoHash':
                struct._id = String(torrent[i][namespace + torrentTags[j]]);
                break;
              // Set the size to the contentLength
              case 'contentLength':
                struct.size = Number(torrent[i][namespace + torrentTags[j]]) ||
                  0;
                break;
              default:
                struct[namespace + torrentTags[j]] =
                  torrent[i][namespace + torrentTags[j]];
            }
          }
        }
        if (typeof(struct.title) === 'undefined' ||
          typeof(struct.title) === 'function') {
          bitcannon.log('Skipping torrent due to missing title');
        } else {
          if (typeof(struct._id) === 'undefined' ||
            typeof(struct._id) === 'function') {
            if (
              torrent[i].enclosure[0].$.url
                .substring(
                  (torrent[i].enclosure[0].$.url.length - 8)
                ) === '.torrent' ||
              torrent[i].enclosure[0].$.url.substring(0, 7) === 'magnet:'
            ) {
            // Always pass a copy of struct to getTorrentInfo, not a reference.
            // Using a reference (which is the default behaviour) causes values
            // to change within the function because of the loop.
              getTorrentInfo(
                String(torrent[i].enclosure[0].$.url),
                JSON.parse(JSON.stringify(struct))
              );
            }
          } else {
            getTorrentInfo(
              String(struct._id),
              JSON.parse(JSON.stringify(struct))
            );
          }
        }
        numberOfItemsParsed++;
        if (numberOfItemsParsed === totalNumberOfItems) {
          bitcannon.log('[OK] Finished Parsing ' + feedURL);
        }
      }
    });
  }

  request({
    'uri': feedURL,
    'headers': {
      'User-Agent': 'BitCannon (https://github.com/aidanharris/bitcannon)',
      'Accept-Encoding': 'gzip',
    },
    'encoding': null,
    'method': 'GET',
    'timeout': 10000,
    'maxRedirects': 10,
    'removeRefererHeader': true,
  }, function (error, response, body) {
    if (error) {
      bitcannon.error(error);
      return callback(error);
    }
    switch (response.headers['content-encoding']) {
      case 'gzip':
        gunzip(body, function (err, body) {
          return parse(err, body, feedURL, callback);
        });
        break;
      default:
        return parse(undefined, body, feedURL, callback);
        break;
    }
  });
};
