"use strict";

const Client = require('bittorrent-tracker');
const parseTorrent = require('parse-torrent');

const fs = require('fs');

const CronJob = require('cron').CronJob;

var nconf = require('nconf');

var debug = require('../server/node_modules/debug');

//Enable debugging for bitcannon
debug.enable('bitcannon:*');

//Bind log to console.log
var log = debug('bitcannon:core');
log.log = console.log.bind(console);

//Bind error to console.warn
var error = debug('bitcannon:core:error');
error.log = console.warn.bind(console);

module.exports = function (configFile) {


    nconf.use('memory');

    var config = function () {
        //Shortcuts to nconf.get so we can get the value of something via config.value()
        /*
         To DO
         * Make this less DRY (https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
         */
        return {
            "bitcannonPort": function(){return nconf.get('bitcannonPort');},
            "bitcannonBindIp": function(){return nconf.get('bitcannonBindIp');},
            "database": function(){return nconf.get('database');},
            "debugLevel": function(){return nconf.get('debugLevel');},
            "scrapeEnabled": function(){return nconf.get('scrapeEnabled');},
            "scrapeDelay": function(){return nconf.get('scrapeDelay');},
            "whitelistEnabled": function(){return nconf.get('whitelistEnabled');},
            "whitelistedCategories": function(){return nconf.get('whitelistedCategories');},
            "blacklistEnabled": function(){return nconf.get('blacklistEnabled');},
            "blacklistedCategories": function(){return nconf.get('blacklistedCategories');},
            "categoryAliases": function(){return nconf.get('categoryAliases');},
            "trackers": function(){return nconf.get('trackers');},
            "archives": function(){return nconf.get('archives');},
            "feeds": function(){return nconf.get('feeds');}
        };

    }();

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
        'debugLevel': 0,
        'scrapeEnabled': true,
        'scrapeDelay': 0,
        'whitelistEnabled': false,
        'whitelistedCategories': [],
        'blacklistEnabled': false,
        'blacklistedCategories': [],
        'categoryAliases': {

        },
        'trackers': [
            'udp://open.demonii.com:1337',
            'udp://tracker.istole.it:80',
            'udp://tracker.openbittorrent.com:80',
            'udp://tracker.publicbt.com:80',
            'udp://tracker.coppersurfer.tk:6969',
            'udp://tracker.leechers-paradise.org:6969',
            'udp://exodus.desync.com:6969'
        ],
        'archives': [

        ],
        'feeds': [

        ]
    };

    /*
     If config is undefined we add a default configuration to nconf to be used if the config file fails to load
     or if environments variables or command line arguments are not set.

     If config is set then we reset the configuration value in question to default. This is useful if the user has
     set the configuration else where but for whatever reason it is incorrect. This way instead of crashing we can
     warn the user and continue running with default values.
     */
    var setDefaults = function(config, value, next) {

        switch (config) {
            case undefined:
                nconf.defaults(defaultConfig);
                break;
            default:
                nconf.set(config,value);
        }

        //Callback
        if(next !== undefined) {
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
    var loadConfigFile = function(configFile) {
        if(typeof configFile !== 'undefined' && !module.exports._configFileLoaded) {
            nconf.argv().env().file({file: configFile});
            setDefaults();
            //Test that the config file can be read.
            //If it can set the configFileLoaded flag to true
            //Else log error information
            fs.access(configFile, fs.R_OK, function(err) {
                if(!err) {
                    module.exports._configFileLoaded = true;
                } else {
                    error("[ERR] Cannot open " + configFile + " for reading. Does it Exist?");
                    error("Falling back to default configuration.");
                }
            });
            //Should validate configuration here...
            try {
                module.exports.database = require('../providers/database/' + config.database() + '/' + config.database());
            }
            catch (err) {
                error('Error loading database provider module: ' + config.database());
                if(config.debugLevel() > 0) {
                    error(err);
                }
                //Log error and fall back to default database
                setDefaults('database', defaultConfig.database, function () {
                    error('Falling back to default: ' + nconf.get('database'));
                });
                module.exports.database = require('../providers/database/' + config.database());
            }
        }
    }(configFile);

    //Function to be called to handle exiting BitCannon
    /*
     This should do things such as closing any open database connections and stopping any imports etc
     Ideally this should prevent any data from getting corrupted
     */
    var exit = function(exitCode) {
        log('BitCannon is shutting down...');
        /*
         To Do
         * Close any open database connections here.
         */
        process.exit(((typeof exitCode === 'undefined') ? 1 : exitCode));
    };

    process.on('SIGINT',function(){
        process.exit(0);
    });

    process.on('exit',function(){
        exit(0);
    });

    var providers = function() {
        function logFn(provider) {
            //Bind log to console.log
            var log = debug('bitcannon:providers' + provider);
            log.log = console.log.bind(console);

            return log;
        }

        function errorFn(provider) {
            //Bind error to console.warn
            var error = debug('bitcannon:providers' + provider);
            error.log = console.warn.bind(console);

            return error;
        }

        var logging = function(providerType,provider) {
            var logs = function(providerType, provider) {
                return logFn(':' + providerType +':' + provider);
            }(providerType,provider);
            var errors = function(providerType, provider) {
                return errorFn(':' + providerType +':' + provider + ':error');
            }(providerType,provider);

            return {
                log: logs,
                error: errors
            };
        };

        var archives = function(provider) {
            var logger = logging('database',provider);
            return {
                log: logger.log,
                error: logger.error
            };
        };

        var database = function(provider) {
            var logger = logging('database',provider);

            //Database schema - All database providers must implement this
            let schema = {
                _id: String,
                title: String,
                category: String,
                size: Number,
                details: Array,
                swarm: {
                    seeders: Number,
                    leechers: Number
                },
                lastmod: Date,
                imported: Date
            };

            return {
                log: logger.log,
                error: logger.error,
                schema: schema
            };

        };

        return {
            archives: archives,
            database: database
        };
    }();

    function scrapeTorrent(btih,callback) {
        var magnet = "magnet:?xt=urn:btih:" + btih + "&tr=" + encodeURIComponent(config.trackers().toString()).replace(new RegExp("%2C","g"),"&tr=");

        var parsedTorrent = parseTorrent(magnet); // { infoHash: 'xxx', length: xx, announce: ['xx', 'xx'] }

        var peerId = new Buffer('01234567890123456789');
        var port = 6881;

        var client = new Client(peerId, port, parsedTorrent);

        var numberOfSeeders = 0;
        var numberOfLeechers = 0;
        var trackers = JSON.parse(JSON.stringify(parsedTorrent.announce));


        var callbackCalled = false;

        function callCallback() {
            if (trackers.length <= 0) {
                client.stop(); //Gracefully leave the swarm
                if (!callbackCalled) {
                    log('[OK] Finished Scraping');
                    log('Average number of leechers in swarm: ' + numberOfLeechers);
                    log('Average number of seeders in swarm: ' + numberOfSeeders);
                    callbackCalled = true;
                    return callback(undefined, {'Leechers': numberOfLeechers, 'Seeders': numberOfSeeders});
                }
            }
        }

        client.on('error', function (err) {
            trackers.pop();
            //Only log scraping errors if debugLevel is greater than 1
            //The reason for this is bittorrent-tracker tends to spam the logs
            //This could be a problem with my code?
            if(config.debugLevel() > 1) {
                // fatal client error!
                error(err.message);
            }
            return callCallback();
        });

        client.on('warning', function (err) {
            trackers.pop();
            if(config.debugLevel() > 1) {
                // a tracker was unavailable or sent bad data to the client. you can probably ignore it
                error(err.message);
            }
            return callCallback();
        });

        // start getting peers from the tracker
        client.start();

        var successfulScrapes = 0;

        // scrape
        client.scrape();

        log('Scraping torrent '  + ' with infohash ' + parsedTorrent.infoHash);
        log('Using magnet: ' + magnet);
        client.on('scrape', function (data) {
            trackers.pop();
            successfulScrapes++; //Increment the number of successful scrapes
            log('got a scrape response from tracker: ' + data.announce);

            numberOfSeeders = parseInt((numberOfSeeders + data.complete) / (successfulScrapes)); //Gets an average parsed as an integer (you can't have half a seeder)
            numberOfLeechers = parseInt((numberOfLeechers + data.incomplete) / (successfulScrapes));

            log('number of seeders in the swarm: ' + data.complete);
            log('number of leechers in the swarm: ' + data.incomplete);

            return callCallback();
        });
    }

    function tasks() {
        for(let i = 0;i < config.archives().length;i++) {
            console.log('Adding task: ' + config.archives()[i].name);
        }
    }

    return {
        config: config,
        database: module.exports.database,
        scrape: scrapeTorrent,
        tasks: tasks,
        exit: exit,
        providers: providers,
        log: log,
        error: error
    };
};