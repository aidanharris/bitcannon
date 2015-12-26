'use strict';

const bitcannon = require('../src/bitcannon')('../config.json');

const parseString = require('xml2js').parseString;

const parseTorrent = require('../src/bitcannon/node_modules/parse-torrent');

const request = require('request');
// require('request-debug')(request);

const zlib = require('zlib');

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

function parse(err, body, callback) {
  function getTorrentInfo(url, struct) {
    if (url.indexOf('http') === 0) {
      parseTorrent.remote(url,
        function (err, parsedTorrent) {
          if (err) {
            console.warn(err);
            throw err;
          }
          struct._id = parsedTorrent.infoHash.toUpperCase();
          return bitcannon.scrape(struct._id, function (err, swarm) {
            struct.swarm.leechers = swarm.Leechers;
            struct.swarm.seeders = swarm.Seeders;
            return callback(err, struct);
          });
        }
      );
    } else {
      return bitcannon.scrape(struct._id, function (err, swarm) {
        struct.swarm.leechers = swarm.Leechers;
        struct.swarm.seeders = swarm.Seeders;
        return callback(err, struct);
      });
    }
  }
  parseString(body, function (err, result) {
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
      struct.category = torrent[i].category || item[i].category;
      struct.title = torrent[i].title || item[i].title;
      struct.details = torrent[i].guid || item[i].guid;
      if (torrentNameSpace || torrentTag) {
        for (let j = 0; j < torrentTags.length; j++) {
          switch (torrentTags[j]) {
            case 'seeds':
              struct.swarm.seeders =
                (typeof(torrent[i][namespace + torrentTags[j]]) ===
                'undefined') ? 0 : torrent[i][namespace + torrentTags[j]];
              break;
            case 'peers':
              struct.swarm.leechers =
                (typeof(torrent[i][namespace + torrentTags[j]]) ===
              'undefined') ? 0 : torrent[i][namespace + torrentTags[j]];
              break;
            case 'infoHash':
              struct._id = torrent[i][namespace + torrentTags[j]];
              break;
            case 'contentLength':
              struct.size = torrent[i][namespace + torrentTags[j]];
              break;
            default:
              struct[namespace + torrentTags[j]] =
                torrent[i][namespace + torrentTags[j]];
          }
          /*
          console.log(namespace + torrentTags[j] + ': ' +
            torrent[i][namespace + torrentTags[j]]);
          */
        }
      } else {
        bitcannon.log('Regular RSS or Atom feed!');
        console.dir(struct);
      }
      if (typeof(struct._id) === 'undefined' ||
      typeof(struct._id) === 'function') {
        if (
          torrent[i].enclosure[0].$.url
            .substring(
              (torrent[i].enclosure[0].$.url.length - 8)
            ) === '.torrent'
        ) {
          // Always pass a copy of struct to getTorrentInfo, not a reference.
          // Using a reference (which is the default behaviour) causes values
          // to change within the function because of the loop.
          getTorrentInfo(
            torrent[i].enclosure[0].$.url,
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
  });
}

// Set RSS feed using export RSS=''
// or RSS='' node index.js
request({
  'uri': process.env.RSS,
  'headers': {
    'User-Agent': 'BitCannon (http://bitcannon.io)',
    'Accept-Encoding': 'gzip',
  },
  'encoding': null,
  'method': 'GET',
  'timeout': 10000,
  'maxRedirects': 10,
  'removeRefererHeader': true,
}, function (error, response, body) {
  let callback = function(err, struct) {
    console.log(struct);
  };
  if (error) {
    bitcannon.error(error);
    throw error;
  }
  switch (response.headers['content-encoding']) {
    case 'gzip':
      gunzip(body, function (err, body) {
        parse(err, body, callback);
      });
      break;
    default:
      parse(undefined, body, callback);
      break;
  }
});
