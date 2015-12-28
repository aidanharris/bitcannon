# BitCannon
~~A torrent site mirroring tool~~

## About
The goal of BitCannon is to provide the tools to easily aggregate the content of many torrent sites into an easily browse-able format.

BitCannon aims to be as user friendly as possible while still providing robustness and the features you would expect. We hope the average user will use BitCannon to keep personal bittorrent archives, but we strive to produce code that can stand up to running a public mirror as well.

## Project Mirrors
This project is available on:
* ~~[GitHub](https://github.com/Stephen304/bitcannon)~~
* ~~[BitBucket](https://bitbucket.org/Stephen304/bitcannon)~~
* ~~[Google Code](https://code.google.com/p/bitcannon/)~~

## How to use: Simple Set-Up
[See the Wiki for regular easy set up instructions](https://github.com/aidanharris/bitcannon/wiki)

## How to use: Building From Source

> If you are not a programmer or do not wish to install this long list of things, use the instructions on the wiki instead!
* NodeJS
* Bower

__(Note: These building instructions may get out of date from time to time due to code changes. If you just want to use BitCannon, you should use the Wiki instructions instead.)__

### MongoDB
* Install and run MongoDB from official packages


### BitCannon
* Clone the repo
* Install dependencies (`make deps`)
* Optionally install dependencies for eslint (`make eslint-deps`)
* Run www with node.js (`node www`)

## Progress
The early version of BitCannon aims to provide import functionality from bittorrent archives and a simple interface to browse and search your torrent database. Later versions may have more advanced features like auto updating torrent indexes and possibly more.

## License
This is MIT licensed, so do whatever you want with it. Just don't blame me for anything that happens.
