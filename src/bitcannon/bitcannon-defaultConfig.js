/**
 # Default configuration

 - bitcannonPort: The port the web server will listen on.
 - bitcannonBindIp: The network interface that the server will bind to.
 \c- Should we bind to localhost (127.0.0.1) by default?
 - databse: The database provider to use.
 If not given the default provider (mongodb) is used.

 - scrapeEnabled:
 - scrapeDelay:
 - Unsure what the above two parameters do.
 Need to find out what they do and document them

 - whitelistEnabled: Should the category whitelist be enabled
 - whitelistedCategories: The list of categories to restrict Bitcannon to.
 It will only import torrents that are in these categories.
 - blacklistEnabled: Should the category blacklist be enabled.
 - blacklistedCategories: The list of categories to block from Bitcannon.
 - categoryAliases: Aliases for categories in the JSON format as follows:
 @code
 {
   category: ['category 1', 'category 2']
 }
 @endcode
 - trackers: Which trackers to use
 - archives: Which archives to use
 - feeds: A list of RSS feeds to import
 */

module.exports = {
  bitcannonPort: '1339',
  bitcannonBindIp: '0.0.0.0',
  database: 'mongodb',
  databaseConfig: {
    address: '127.0.0.1',
    port: '27017',
    database: 'bitcannon',
    limit: 200,
  },
  openBrowser: true,
  debugLevel: 0,
  scrapeEnabled: true,
  scrapeDelay: 0,
  whitelistEnabled: false,
  whitelistedCategories: [],
  blacklistEnabled: false,
  blacklistedCategories: [],
  categoryAliases: {},
  trackers: [
    'udp://open.demonii.com:1337',
    'udp://tracker.istole.it:80',
    'udp://tracker.openbittorrent.com:80',
    'udp://tracker.publicbt.com:80',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://tracker.leechers-paradise.org:6969',
    'udp://exodus.desync.com:6969',
  ],
  archives: [],
  feeds: [],
};
