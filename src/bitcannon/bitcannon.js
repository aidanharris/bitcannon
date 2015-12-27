'use strict';

const Client = require('bittorrent-tracker');
const parseTorrent = require('parse-torrent');

const fs = require('fs');

const rss = require('../providers/rss');

const CronJob = require('cron').CronJob;

const nconf = require('nconf');

const debug = require('../server/node_modules/debug');

// Enable debugging for bitcannon
debug.enable('bitcannon:*');

// Bind log to console.log
const log = debug('bitcannon:core');
log.log = console.log.bind(console);

// Bind error to console.warn
const error = debug('bitcannon:core:error');
error.log = console.warn.bind(console);

module.exports = function (configFile) {
  nconf.use('memory');

  const config = (function () {
    // Shortcuts to nconf.get so we can get the value of something
    // via config.value()
    /*
     To DO
     * Make this less DRY
     * (https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
     */
    function bitcannonPort() {
      return nconf.get('bitcannonPort');
    }
    function bitcannonBindIp() {
      return nconf.get('bitcannonBindIp');
    }
    function database() {
      return nconf.get('database');
    }
    function databaseConfig() {
      return nconf.get('databaseConfig');
    }
    function debugLevel() {
      return nconf.get('debugLevel');
    }
    function scrapeEnabled() {
      return nconf.get('scrapeEnabled');
    }
    function scrapeDelay() {
      return nconf.get('scrapeDelay');
    }
    function whitelistEnabled() {
      return nconf.get('whitelistEnabled');
    }
    function whitelistedCategories() {
      return nconf.get('whitelistedCategories');
    }
    function blacklistEnabled() {
      return nconf.get('blacklistEnabled');
    }
    function blacklistedCategories() {
      return nconf.get('blacklistedCategories');
    }
    function categoryAliases() {
      return nconf.get('categoryAliases');
    }
    function trackers() {
      return nconf.get('trackers');
    }
    function archives() {
      return nconf.get('archives');
    }
    function feeds() {
      return nconf.get('feeds');
    }

    return {
      bitcannonPort,
      bitcannonBindIp,
      database,
      databaseConfig,
      debugLevel,
      scrapeEnabled,
      scrapeDelay,
      whitelistEnabled,
      whitelistedCategories,
      blacklistEnabled,
      blacklistedCategories,
      categoryAliases,
      trackers,
      archives,
      feeds,
    };
  })();

  /*
   Default configuration

   bitcannonPort: The port the web server will listen on.
   bitcannonBindIp: The network interface that the server will bind to.
   - Should we bind to localhost (127.0.0.1) by default?
   databse: The database provider to use. If not given the default provider (mongodb) is used.

   scrapeEnabled:
   scrapeDelay:
   Unsure what the above two parameters do.
   Need to find out what they do and document them

   whitelistEnabled: Should the category whitelist be enabled
   whitelistedCategories: The list of categories to restrict Bitcannon to.
   It will only import torrents that are in these categories.
   blacklistEnabled: Should the category blacklist be enabled.
   blacklistedCategories: The list of categories to block from Bitcannon.
   categoryAliases: Aliases for categories in the JSON format as follows:
   {
   category: ['category 1', 'category 2']
   }
   trackers: Which trackers to use
   archives: Which archives to use
   feeds: A list of RSS feeds to import


   */
  const defaultConfig = {
    'bitcannonPort': '1339',
    'bitcannonBindIp': '0.0.0.0',
    'database': 'mongodb',
    'databaseConfig': {
      'address': '127.0.0.1',
      'database': 'bitcannon',
    },
    'debugLevel': 0,
    'scrapeEnabled': true,
    'scrapeDelay': 0,
    'whitelistEnabled': false,
    'whitelistedCategories': [],
    'blacklistEnabled': false,
    'blacklistedCategories': [],
    'categoryAliases': {},
    'trackers': [
      'udp://open.demonii.com:1337',
      'udp://tracker.istole.it:80',
      'udp://tracker.openbittorrent.com:80',
      'udp://tracker.publicbt.com:80',
      'udp://tracker.coppersurfer.tk:6969',
      'udp://tracker.leechers-paradise.org:6969',
      'udp://exodus.desync.com:6969',
    ],
    'archives': [],
    'feeds': [],
  };

  /*
   If config is undefined we add a default configuration to nconf to be used if the config file fails to load
   or if environments variables or command line arguments are not set.

   If config is set then we reset the configuration value in question to default. This is useful if the user has
   set the configuration else where but for whatever reason it is incorrect. This way instead of crashing we can
   warn the user and continue running with default values.
   */
  const setDefaults = function (config, value, next) {
    switch (config) {
      case undefined:
        nconf.defaults(defaultConfig);
        break;
      default:
        nconf.set(config, value);
    }

    // Callback
    if (next !== undefined) {
      next();
    }
  };

  module.exports._configFileLoaded = false;

  /*
   To Do
   * Add a function to reload configuration
   * Set module.exports._configFileLoaded to false
   * Call loadConfigFile function again
   */
  (function loadConfigFile(configFile) {
    if (typeof configFile !== 'undefined' &&
      !module.exports._configFileLoaded) {
      nconf.argv().env().file({ file: configFile });
      setDefaults();
      // Test that the config file can be read.
      // If it can set the configFileLoaded flag to true
      // Else log error information
      fs.access(configFile, fs.R_OK, function (err) {
        if (!err) {
          module.exports._configFileLoaded = true;
        } else {
          error('[ERR] Cannot open ' +
            configFile +
            ' for reading. Does it Exist?');
          error('Falling back to default configuration.');
        }
      });
      // Should validate configuration here...
      try {
        module.exports.database = require('../providers/database/' +
          config.database() +
          '/' +
          config.database());
      } catch (err) {
        error('Error loading database provider module: ' + config.database());
        if (config.debugLevel() > 0) {
          error(err);
        }
        // Log error and fall back to default database
        setDefaults('database', defaultConfig.database, function () {
          error('Falling back to default: ' + nconf.get('database'));
        });
        module.exports.database = require('../providers/database/' +
          config.database());
      }
    }
  })(configFile);

  // Function to be called to handle exiting BitCannon
  /*
   This should do things such as closing any open database connections and stopping any imports etc
   Ideally this should prevent any data from getting corrupted
   */
  const exit = function (exitCode) {
    log('BitCannon is shutting down...');
    /*
     To Do
     * Close any open database connections here.
     */
    process.exit(((typeof exitCode === 'undefined') ? 1 : exitCode));
  };

  process.on('SIGINT', function () {
    process.exit(0);
  });

  process.on('exit', function () {
    exit(0);
  });

  const providers = (function () {
    // Database schema - All database providers must implement this
    const schema = {
      _id: String,
      title: String,
      category: String,
      size: Number,
      details: Array,
      swarm: {
        seeders: Number,
        leechers: Number,
      },
      lastmod: Date,
      imported: Date,
    };
    const torrentStruct = function () {
      return {
        _id: schema._id,
        title: schema.title,
        category: schema.category,
        size: schema.size,
        details: schema.details,
        swarm: {
          seeders: schema.swarm.seeders,
          leechers: schema.swarm.leechers,
        },
        lastmod: schema.lastmod,
        imported: schema.imported,
      };
    };
    function logFn(provider) {
      // Bind log to console.log
      const log = debug('bitcannon:providers' + provider);
      log.log = console.log.bind(console);

      return log;
    }

    function errorFn(provider) {
      // Bind error to console.warn
      const error = debug('bitcannon:providers' + provider);
      error.log = console.warn.bind(console);

      return error;
    }

    const logging = function (providerType, provider) {
      const logs = (function (providerType, provider) {
        return logFn(':' + providerType + ':' + provider);
      })(providerType, provider);
      const errors = (function (providerType, provider) {
        return errorFn(':' + providerType + ':' + provider + ':error');
      })(providerType, provider);

      return {
        log: logs,
        error: errors,
      };
    };

    const archives = function (provider) {
      const logger = logging('database', provider);
      return {
        log: logger.log,
        error: logger.error,
      };
    };

    const database = function (provider) {
      const logger = logging('database', provider);

      return {
        log: logger.log,
        error: logger.error,
        schema: torrentStruct(),
      };
    };

    return {
      archives,
      database,
      torrentStruct,
    };
  })();

  function scrapeTorrent(btih, callback) {
    const magnet = 'magnet:?xt=urn:btih:' +
      btih +
      '&tr=' +
      encodeURIComponent(config.trackers().toString())
        .replace(new RegExp('%2C', 'g'), '&tr=');

    // { infoHash: 'xxx', length: xx, announce: ['xx', 'xx'] }
    const parsedTorrent = parseTorrent(magnet);

    const peerId = new Buffer('01234567890123456789');
    const port = 6881;

    const client = new Client(peerId, port, parsedTorrent);

    let numberOfSeeders = 0;
    let numberOfLeechers = 0;
    let successfulScrapes = 0;
    const trackers = JSON.parse(JSON.stringify(parsedTorrent.announce));


    let callbackCalled = false;

    function callCallback(err) {
      if (trackers.length <= 0) {
        client.stop(); // Gracefully leave the swarm
        if (!callbackCalled) {
          callbackCalled = true;
          if (config.debugLevel() > 1) {
            log('[OK] Finished Scraping ' + parsedTorrent.infoHash);
          }
          // log('Average number of leechers in swarm: ' + numberOfLeechers);
          // log('Average number of seeders in swarm: ' + numberOfSeeders);
          if (successfulScrapes > 0) {
            return callback(err, {
              'Leechers': numberOfLeechers,
              'Seeders': numberOfSeeders,
            });
          }
          return callback(err, {
            'Leechers': -1,
            'Seeders': -1,
          });
        }
      }
    }

    client.on('error', function (err) {
      trackers.pop();
      // Only log scraping errors if debugLevel is greater than 1
      // The reason for this is bittorrent-tracker tends to spam the logs
      // This could be a problem with my code?
      if (config.debugLevel() > 1) {
        // fatal client error!
        error(err.message);
      }
      return callCallback(err);
    });

    client.on('warning', function (err) {
      trackers.pop();
      if (config.debugLevel() > 1) {
        // a tracker was unavailable or sent bad data to the client. you can probably ignore it
        error(err.message);
      }
      return callCallback(err);
    });

    // start getting peers from the tracker
    client.start();

    // scrape
    client.scrape();

    //log('Scraping torrent ' + ' with infohash ' + parsedTorrent.infoHash);
    client.on('scrape', function (data) {
      trackers.pop();
      successfulScrapes++; // Increment the number of successful scrapes

      // Gets an average parsed as an integer (you can't have half a seeder)
      numberOfSeeders = parseInt(
        (numberOfSeeders + data.complete) / (successfulScrapes), 10
      );
      numberOfLeechers = parseInt(
        (numberOfLeechers + data.incomplete) / (successfulScrapes), 10
      );

      return callCallback();
    });
  }

  function tasks() {
    // All scheduled tasks will be pushed to this array
    let jobs = [];
    // All archive providers will be stored here before
    // being pushed to the jobs array
    let archives = [];
    // All feeds will be stored here before being pushed
    // to the jobs array.
    let feeds = [];

    function startup(callback) {
      if (jobs.length === 0) {
        // Load modules
        if (config.archives().length > 0) {
          log('Loading archive providers...');
          // Require each module
          // var module = require('blahblah');
          // Push each provider to archives in the following format:
          // { "module": module, "frequency": config.archives()[i].frequency }
        }
        if (config.feeds().length > 0) {
          log('Scheduling RSS feeds to parse...');
        }
      }
      return callback();
    }

    // Start tasks
    function start() {
      startup(function () {
        if (config.archives().length > 0) {
          for (let i = 0; i < config.archives().length; i++) {
            log('Adding task: ' + config.archives()[i].name);
          }
        }
        for (let i = 0; i < config.feeds().length; i++) {
          log('Adding task: ' + config.feeds()[i].url);
          /* eslint-disable no-loop-func */
          /* jshint -W083 */
          rss(
            String(config.feeds()[i].url),
            (typeof(config.feeds()[i].category) !== 'undefined') ?
              String(config.feeds()[i].category) :
              undefined,
            function (err, struct) {
              module.exports.database.exists(struct._id,
                function (err, torrent) {
                  try {
                    if (torrent.length === 0) {
                      struct.lastmod = new Date().toISOString();
                      struct.imported = struct.lastmod;
                      struct.size = struct.size || 0;
                      module.exports.database.add(struct, function () {
                        log('Added ' + struct.title + ' to the database.');
                      });
                    } else {
                      log('Skipping ' + struct.title);
                      // Should update the seeder and leecher count here
                    }
                  } catch (err) {
                    error(err);
                    throw err;
                  }
                }
              );
            }
          );
          /* eslint-enable no-loop-func */
          /* jshint +W083 */
        }
      });
      log(config.feeds());
    }

    // Stop tasks
    function stop() {

    }

    return {
      start,
      stop,
    };
  }

  return {
    config,
    database: module.exports.database,
    scrape: scrapeTorrent,
    tasks: tasks(),
    exit,
    providers,
    log,
    error,
  };
};
