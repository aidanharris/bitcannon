# [DEPRECATED] - Please use [bitcannon-web](https://github.com/bitcannon-org/bitcannon-web)

## BitCannon
A torrent site mirroring tool

<strong>[Developer Dependencies](https://david-dm.org/aidanharris/bitcannon#info=devDependencies)</strong>

![](https://david-dm.org/aidanharris/bitcannon/dev-status.svg)

<strong>[Bitcannon-Core](https://david-dm.org/aidanharris/bitcannon?path=src/bitcannon)</strong>

![](https://david-dm.org/aidanharris/bitcannon.svg?path=src/bitcannon)

<strong>[Bitcannon-Server](https://david-dm.org/aidanharris/bitcannon?path=src/server)</strong>

![](https://david-dm.org/aidanharris/bitcannon.svg?path=src/server)

<strong>[Bitcannon-MongoDB](https://david-dm.org/aidanharris/bitcannon?path=src/providers/database/mongodb)</strong>

![](https://david-dm.org/aidanharris/bitcannon.svg?path=src/providers/database/mongodb)

<strong>[Bitcannon-Torrent-RSS-Feed-Parser](https://david-dm.org/aidanharris/bitcannon?path=src/providers/rss)</strong>

![](https://david-dm.org/aidanharris/bitcannon.svg?path=src/providers/rss)

## About
The goal of BitCannon is to provide the tools to easily aggregate the content of many torrent sites into an easily browse-able format.

BitCannon aims to be as user friendly as possible while still providing robustness and the features you would expect. We hope the average user will use BitCannon to keep personal bittorrent archives, but we strive to produce code that can stand up to running a public mirror as well.

## Demo

You can view a demo of BitCannon [HERE](https://bitcannon.aidanharr.is).

The demo uses [Docker](https://github.com/aidanharris/bitcannon/wiki/Installing-BitCannon#using-docker) and is restarted every fifteen minutes.

## Project Mirrors
This project is available on:
* [GitHub](https://github.com/aidanharris/bitcannon)
* [BitBucket](https://bitbucket.org/aidanharris/bitcannon)
* [git.aidanharr.is](https://git.aidanharr.is/aidanharris/bitcannon)
* [ZeroNet](https://github.com/HelloZeroNet/ZeroNet) - 1KbvKtQs6wKHB1m7YefeFetGMb5eSUxvZH

## How to use: Simple Set-Up
[See the Wiki for regular easy set up instructions](https://github.com/aidanharris/bitcannon/wiki)

## How to use: Building From Source

> If you are not a programmer or do not wish to install this long list of things, use the instructions on the wiki instead!
* NodeJS
* Bower

<strong>(Note: These building instructions may get out of date from time to time due to code changes. If you just want to use BitCannon, you should use the Wiki instructions instead.)</strong>

### MongoDB
* Install and run MongoDB from official packages

### Node.js

* Install [Node.js](https://github.com/aidanharris/bitcannon/wiki/Installing-Node.js) (version 5.x.x or above because we use some of the newer features of the JavaScript language - const, let, etc…)

### BitCannon
* Clone the repo
* Install dependencies (`make deps`)
* Optionally install dependencies for eslint (`make eslint-deps`)
* Run www with node.js (`node www`)

### Packaging

* Run the Makefile (`make`)
* If using Linux or OS X, [Wine](https://www.winehq.org) is needed in order to set the icon, install wine or edit the Makefile to remove the `--icon` parameter.
* [7-Zip](http://www.7-zip.org) is needed to make the zip files.

## Progress
The early version of BitCannon aims to provide import functionality from bittorrent archives and a simple interface to browse and search your torrent database. Later versions may have more advanced features like auto updating torrent indexes and possibly more.

## License
This is MIT licensed, so do whatever you want with it. Just don't blame me for anything that happens.
