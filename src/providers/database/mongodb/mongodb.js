"use strict";

var bitcannon = require('../../../bitcannon')();
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var mongodb = module.exports = function () {

//Database helper functions from bitcannon.providers.database
  var databaseHelper = bitcannon.providers.database('mongodb');
  var log = databaseHelper.log;
  var error = databaseHelper.error;

  //Bitcannon Database Structure
  var bitcannonTorrentSchema = new Schema(databaseHelper.schema);

  var bitcannonTorrentsModel = mongoose.model('torrents', bitcannonTorrentSchema);

  //To Do
  // * Make this dynamic instead of hardcoded
  var dbURI = 'mongodb://localhost/bitcannon';

  var open = function (callback) {
    //If we are already connected we don't need to open another connection
    //Doing so would cause an error
    if (mongoose.connection.readyState !== 1) {
      mongoose.connect(dbURI);
      var db = mongoose.connection;

      // CONNECTION EVENTS
      // When successfully connected
      db.on('connected', function () {
        if (typeof(callback) === 'function') {
          return callback();
        }
      });

      // If the connection throws an error
      db.on('error', function (err) {
        if (typeof(callback) === 'function') {
          return callback(err);
        }
      });
    } else {
      //We have a connection so trigger the callback
      if (typeof(callback) === 'function') {
        return callback();
      }
    }
  };

  var close = function (callback) {
    mongoose.connection.close(function () {
      if (typeof(callback) === 'function') {
        return callback();
      }
    });
  };

  //Public function that tests connecting to the database
  var test = function (callback) {
    // Create the database connection
    var conn = open(function (err) {
      if (err) {
        error(err.message);
        if (bitcannon.config.debugLevel() > 0) {
          error(err);
        }
      } else {
        log('[OK!] Sucessfully connected to ' + dbURI);
      }
      if (typeof(callback) === 'function') {
        return callback(err);
      }
    });
  };

  //Search methods
  var get = function () {

    //database.get.search
    var search = function (searchTerm, category, skip, callback) {
      bitcannonTorrentsModel.collection.aggregate({$match: {$text: {$search: searchTerm}}}, ((category === undefined) ? {$match: {category: /^(.*)$/}} : {$match: {category: category}}), {$sort: {"swarm.seeders": -1}}, {"$skip": skip}, {"$limit": 200}, function (err, torrents) {
        if (err) {
          error(err);
        }
        if (typeof(callback) === 'function') {
          return callback(err, torrents);
        }
      });
    };

    //database.get.stats
    //Returns the number of torrents in the database in the following format:
    /*
     Count: Total number of torrents in the database
     {
     "Count": 11019460,
     }
     */
    var stats = function (callback) {
      bitcannonTorrentsModel.collection.stats(function (err, torrents) {
        if (err) {
          error(err);
          if (typeof(callback) === 'function') {
            callback(err);
          }
        } else {
          if (typeof(callback) === 'function') {
            callback(err, torrents.count);
          }
        }
      });
    };

    //database.get.categories
    //Returns a list of all categories in the database as an array of JSON objects in the following format:
    /*
     count: Amount of torrents in category
     name: Name of the category
     [{"count": 247869,"name": "Movies"}]
     */
    var categories = function (callback) {
      //Get all categories
      bitcannonTorrentsModel.collection.distinct('category', function (err, categories) {
        if (err) {
          error(err);
          if (typeof(callback) === 'function') {
            return callback(err);
          }
        }
        let categoriesJSON = [];
        let categoriesLength = categories.length;
        for (var i = 0; i < categoriesLength; i++) {
          categoriesJSON.push(
            {
              count: -1,
              name: categories.pop()
            }
          );
          //Keep track of the number of completed async operations
          //Because Node.js is asynchronous this is necessary since
          //the function below will fire at different times for each index i
          var asyncOperations = 0;
          //jshint loopfunc: true
          const getCategoryCount = function (i, callback) {
            bitcannonTorrentsModel.count({category: categoriesJSON[i].name}, function (err, count) {
              if (err) {
                error(err);
                return callback(err);
              }
              categoriesJSON[i].count = count;
              asyncOperations++;
              if (asyncOperations === categoriesLength) {
                if (typeof(callback) === 'function') {
                  return callback(err, categoriesJSON.reverse());
                }
              }
            });
          }(i, callback);
        }
      });
    };

    //database.get.category
    //Returns a list of all torrents in a category in the following format:
    //To Do - Extend this to return X results instead of all of them.
    /*
     Btih: Bitorrent Info Hash (https://en.wikipedia.org/wiki/Magnet_URI_scheme)
     Category: The category the torrent is in
     Details: An array of information?
     Imported: Date torrent was added to the database
     Lastmod: The date the torrent was last modified in the database
     Size: The size of the files downloadable via the torrent?
     Swarm: A JSON object containing information regarding the Bittorrent swarm the torrent is in
     Swarm.Leechers: The number of leechers in the swarm
     Swarm.Seeders: The number of seeders in the swarm
     Title: The title of the torrent
     [{
     "Btih": "Btih1",
     "Category": "Movies",
     "Details": [
     "http://example.com"
     ],
     "Imported": "2015-04-02T13:15:24.943+01:00",
     "Lastmod": "2015-04-03T18:52:29.186+01:00",
     "Size": 0,
     "Swarm": {
     "Leechers": 2598,
     "Seeders": 1781
     },
     "Title": "Example Torrent 1"
     }]
     */
    const category = function (category, limit, callback) {
      /* eslint-disable object-shorthand */
      bitcannonTorrentsModel.find({ 'category': category })
        .limit(limit)
        .sort({ 'swarm.seeders': -1 })
        .exec(function (err, torrents) {
          if (err) {
            error(err);
          }
          if (typeof(callback) === 'function') {
            callback(err, torrents);
          }
        });
      /* eslint-enable object-shorthand */
    };

    const torrent = function (btih, callback) {
      bitcannonTorrentsModel.findOne({ _id: btih })
        .exec(function (err, torrent) {
          if (err) {
            error(err);
          }
          if (typeof(callback) === 'function') {
            return callback(err, torrent);
          }
        });
    };

    return {
      search,
      stats,
      categories,
      category,
      torrent,
    };
  };

  // Function to check if a record exists in the database
  // If a record exists this record is returned to the callback
  function exists(btih, callback) {
    bitcannonTorrentsModel.find({ _id: btih }).exec(function (err, torrent) {
      if (err) {
        error(err);
      }
      if (typeof(callback) === 'function') {
        callback(err, torrent);
      }
    });
  }

  function update() {
    // Function to update a record in the database
    const record = function (id, struct, callback) {
      bitcannonTorrentsModel.findOneAndUpdate({ _id: id },
        struct,
        { upsert: false, new: true },
        function (err, raw) {
          if (err) {
            error(err);
          }
          if (typeof(callback) === 'function') {
            callback(err, raw);
          }
        });
    };

    return {
      record,
    };
  }

  function addTorrent(torrent, callback) {
    return callback(torrent);
  }

  function deleteRecord(id, callback) {
    return callback(id);
  }

  return {
    name: 'MongoDB',
    test,
    exists,
    get: get(),
    addTorrent,
    update: update(),
    delete: deleteRecord,
  };
}();
