'use strict';

const bitcannon = require('../../../bitcannon')();
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

module.exports = (function () {
// Database helper functions from bitcannon.providers.database
  const databaseHelper = bitcannon.providers.database('mongodb');
  const log = databaseHelper.log;
  const error = databaseHelper.error;

  // Bitcannon Database Structure
  const bitcannonTorrentSchema = new Schema(databaseHelper.schema);

  const bitcannonTorrentsModel = mongoose.model(
    'torrents',
    bitcannonTorrentSchema
  );

  // To Do
  // * Make this dynamic instead of hardcoded
  const dbURI = 'mongodb://' +
    (
        (typeof(bitcannon.config.databaseConfig().user) !== 'undefined') ?
        bitcannon.config.databaseConfig().user : ''
    ) +
    (
        (typeof(bitcannon.config.databaseConfig().password) !== 'undefined') ?
        ' : ' + bitcannon.config.databaseConfig().password + ' @' : ''
    ) +
    bitcannon.config.databaseConfig().address + ':' +
    bitcannon.config.databaseConfig().port + '/' +
    bitcannon.config.databaseConfig().database;

  const open = function (callback) {
    let db;
    // If we are already connected we don't need to open another connection
    // Doing so would cause an error
    if (mongoose.connection.readyState !== 1) {
      mongoose.connect(dbURI);
      db = mongoose.connection;

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
      // We have a connection so trigger the callback
      if (typeof(callback) === 'function') {
        return callback(undefined);
      }
    }
  };

  const close = function (callback) {
    mongoose.connection.close(function () {
      if (typeof(callback) === 'function') {
        return callback();
      }
    });
  };

  // Perform any setup necessary to create the database.
  // Mongoose doesn't need this since it will create any
  // collections that do not exist when inserting documents.
  // However other databases might not do this and require
  // an initial setup to create the database and any tables
  // this function should be used to do that.
  const setup = function (callback) {
    return;
  };

  // Public function that tests connecting to the database
  const test = function (callback) {
    // Create the database connection
    open(function (err) {
      if (err) {
        error(err.message);
        if (bitcannon.config.debugLevel() > 0) {
          error(err);
        }
      } else {
        log('[OK!] Sucessfully connected to ' + dbURI);
        mongoose.connection.db.listCollections({name: 'torrents'})
            .next(function (err, collinfo) {
              if (!collinfo) {
                // The collection exists
                error('torrents collection does not exist!');
                error('Creating it...');
                setup();
              }
              return callback(err);
            });
      }
    });
  };

  // Search methods
  const get = function () {
    // database.get.search
    const search = function (searchTerm, category, skip, callback) {
      // .replace(new RegExp('\\*', 'g'), '/^(.*)$/')
      bitcannonTorrentsModel.collection
        .aggregate({ $match: { $text: { $search: searchTerm } } },
          (
            (typeof(category) === 'undefined') ?
            { $match: { category: /^(.*)$/ } } :
            { $match: { category } }
          ),
          { $sort: { 'swarm.seeders': -1 } },
          { '$skip': skip },
          { '$limit': 200 },
          function (err, torrents) {
            if (err) {
              error(err);
            }
            if (typeof(callback) === 'function') {
              return callback(err, torrents);
            }
          }
        );
    };

    // database.get.stats
    // Returns the number of torrents in the database in the following format:
    /*
     Count: Total number of torrents in the database
     {
     "Count": 11019460,
     }
     */
    const stats = function (callback) {
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

    // database.get.categories
    // Returns a list of all categories in the database as an array of
    // JSON objects in the following format:
    /*
     count: Amount of torrents in category
     name: Name of the category
     [{"count": 247869,"name": "Movies"}]
     */
    const categories = function (callback) {
      // Get all categories
      bitcannonTorrentsModel.collection.distinct('category',
        function (err, categories) {
          if (err) {
            error(err);
            if (typeof(callback) === 'function') {
              return callback(err);
            }
          }
          // Keep track of the number of completed async operations
          // Because Node.js is asynchronous this is necessary since
          // the function below (getCategoryCount) will fire at
          // different times for each index i
          let asyncOperations = 0;
          let categoriesJSON;
          categoriesJSON = [];
          const categoriesLength = categories.length;
          const getCategoryCount = function (i, callback) {
            bitcannonTorrentsModel.count({ category: categoriesJSON[i].name },
              function (err, count) {
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
              }
            );
          };
          for (let i = 0; i < categoriesLength; i++) {
            categoriesJSON.push(
              {
                count: -1,
                name: categories.pop(),
              }
            );
            getCategoryCount(i, callback);
          }
        }
      );
    };

    // database.get.category
    // Returns a list of all torrents in a category in the following format:
    // To Do - Extend this to return X results instead of all of them.
    /*
     Btih: Bitorrent Info Hash (https://en.wikipedia.org/wiki/Magnet_URI_scheme)
     Category: The category the torrent is in
     Details: An array of information?
     Imported: Date torrent was added to the database
     Lastmod: The date the torrent was last modified in the database
     Size: The size of the files downloadable via the torrent?
     Swarm: A JSON object containing information regarding the
      Bittorrent swarm the torrent is in
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
      bitcannonTorrentsModel.find({ category })
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
    bitcannonTorrentsModel.collection.insert(torrent);
    if (typeof(callback) === 'function') {
      return callback(torrent);
    }
  }

  function deleteRecord(id, callback) {
    return callback(id);
  }

  return {
    name: 'MongoDB',
    open,
    close,
    test,
    exists,
    get: get(),
    add: addTorrent,
    update: update(),
    delete: deleteRecord,
  };
})();
