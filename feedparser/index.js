'use strict';

const bitcannon = require('../src/bitcannon')();

const parseString = require('xml2js').parseString;

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

function parse(err, body) {
  parseString(body, function (err, result) {
    let xmlns = '';
    let torrentTag = false;
    let torrentNameSpace = false;
    let namespace = '';
    let torrent;
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
    try {
      // <torrent xmlns="http://xmlns.ezrss.it/0.1/">
      //    <infoHash>...</infoHash>
      // </torrent>
      xmlns = result.rss.channel[0].torrent[0].$.xmlns;
      torrentTag = true;
    } catch (err) {
      try {
        // <rss xmlns:torrent="http://xmlns.ezrss.it/0.1/">
        //    <torrent:infoHash>...</torrent:infoHash>
        // </rss>
        xmlns = result.rss.$['xmlns:torrent'];
        torrentNameSpace = true;
      } catch (err) {
        // <rss xmlns:atom="http://www.w3.org/2005/Atom">
        //    ...
        //    <enclosure url="http://example.com/example.torrent"
        //               type="application/x-bittorrent"
        //               length="10000"
        //    />
        //    ...
        // </rss>
        try {
          xmlns = result.rss.$['xmlns:atom'];
        } catch (err) {
          bitcannon.error(err);
          throw err;
        }
      }
    }
    if (torrentNameSpace || torrentTag) {
      if (torrentNameSpace) {
        namespace = 'torrent:';
        torrent = result.rss.channel[0].item;
      } else {
        torrent = result.rss.channel[0].torrent;
      }
      for (let i = 0, struct = bitcannon.providers.torrentStruct();
        i < result.rss.channel[0].item.length; i++) {
        struct.category = torrent[i].category;
        struct.title = torrent[i].title;
        struct.details = torrent[i].guid;
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
        /*
        console.log('enclosure: ' + torrent[i].enclosure[0].$.url);
        */
        console.log(struct);
      }
    } else {
      console.log(xmlns);
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
  if (error) {
    bitcannon.error(error);
    throw error;
  }
  switch (response.headers['content-encoding']) {
    case 'gzip':
      gunzip(body, function (err, body) {
        parse(err, body);
      });
      break;
    default:
      parse(undefined, body);
      break;
  }
});
