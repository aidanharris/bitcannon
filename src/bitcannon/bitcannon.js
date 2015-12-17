var fs = require('fs');
var nconf = require('nconf');

var debug = require('../server/node_modules/debug');

//Enable debugging
debug.enable('bitcannon:core');
debug.enable('bitcannon:core:error');

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
        return {
            bitcannonPort: function(){return nconf.get('bitcannonPort');},
            bitcannonBindIp: function(){return nconf.get('bitcannonBindIp');},
            database: function(){return nconf.get('database');},
            debugLevel: function(){return nconf.get('debugLevel');},
            scrapeEnabled: function(){return nconf.get('scrapeEnabled');},
            scrapeDelay: function(){return nconf.get('scrapeDelay');},
            whitelistEnabled: function(){return nconf.get('whitelistEnabled');},
            whitelistedCategories: function(){return nconf.get('whitelistedCategories');},
            blacklistEnabled: function(){return nconf.get('blacklistEnabled');},
            blacklistedCategories: function(){return nconf.get('blacklistedCategories');},
            categoryAliases: function(){return nconf.get('categoryAliases');},
            trackers: function(){return nconf.get('trackers');},
            archives: function(){return nconf.get('archives');},
            feeds: function(){return nconf.get('feeds');}
        }

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
    var setDefaults = function(configValue, next) {
        var defaultConfig = {
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

        switch (configValue) {
            case undefined:
                nconf.defaults(defaultConfig);
                break;
            default:
                nconf.set(configValue,(eval('defaultConfig.' + configValue))); //This is probably not safe...
        }

       //Callback
       if(next !== undefined) {
           next();
       }
    };

    var database = undefined;

    var loadConfigFile = function(configFile) {
        nconf.argv().env().file({ file: configFile }),
            setDefaults()
            //Should validate configuration here...
            try {
                database = require('../providers/database/' + config.database() + '/' + config.database());
            }
            catch (err) {
                error('Error loading database provider module: ' + config.database());
                //Log error and fall back to default database
                setDefaults('database', function() {
                    log('Falling back to default: ' + nconf.get('database'));
                });

                database = require('../providers/database/' + config.database() + '/' + config.database());
            }
    }(configFile);

    return {
        config: config,
        database: database,
        log: log,
        error: error
    }
};