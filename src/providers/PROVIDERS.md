# Providers

Providers are Node.js modules that implement a defined API. The benefit of this is that BitCannon can define an abstract API for various things such as databases and archives and not care about how they are implemented. For example this will allow BitCannon to use a different database technology and not care about how that database technology works. BitCannon will simply call various pre-defined functions implemented by a database provider module and it will "just work".

## Database Providers

Documentation on the database provider API can be found [HERE](#).

## Archive Providers

Archive providers are modules that BitCannon uses to import torrents from various websites.

Documentation on the archive provider API can be found [HERE](#).
