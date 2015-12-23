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
        xmlns = result.rss.$['xmlns:atom'];
      }
    }
    if (torrentNameSpace || torrentTag) {
      console.log(result.rss.channel[0]);
      console.log('xmlns: ' + xmlns);
      console.log(result.rss.channel[0].item.length);
    }
  });
}

request({
  'uri': 'http://127.0.0.1:8000/rss.xml',
  'headers': {
    'User-Agent': 'BitCannon (http://bitcannon.io)',
    'Accept-Encoding': 'gzip',
  },
  'encoding': null,
  'method': 'GET',
  'timeout': 10000,
  'followRedirect': false,
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
