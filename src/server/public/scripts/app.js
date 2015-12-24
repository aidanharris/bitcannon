'use strict';

/**
 * @ngdoc overview
 * @name bitCannonApp
 * @description
 * # bitCannonApp
 *
 * Main module of the application.
 */
angular
  .module('bitCannonApp', [
    'ngAnimate',
    'ui.router',
    'angular-loading-bar',
    'angularMoment',
    'infinite-scroll',
  ])
  .config(function ($stateProvider, $urlRouterProvider, $compileProvider) {
    var allowedURISchemes = /^\s*(https?|ftp|mailto|chrome-extension|magnet):/;
    $compileProvider.aHrefSanitizationWhitelist(allowedURISchemes);
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('index', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        pageTitle: 'Home',
      })
      .state('browse', {
        url: '/browse',
        templateUrl: 'views/browse.html',
        controller: 'BrowseCtrl',
        pageTitle: 'Browse',
      })
      .state('browseSearch', {
        url: '/browse/:category',
        templateUrl: 'views/search.html',
        controller: 'BrowsesearchCtrl',
        pageTitle: 'Browse',
      })
      .state('search', {
        url: '/search/:query',
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl',
        pageTitle: 'Search',
      })
      .state('searchCategory', {
        url: '/search/:query/c/:category',
        templateUrl: 'views/search.html',
        controller: 'SearchCtrl',
        pageTitle: 'Search',
      })
      .state('torrent', {
        url: '/torrent/:btih',
        templateUrl: 'views/torrent.html',
        controller: 'TorrentCtrl',
        pageTitle: 'Torrent',
      })
      .state('about', {
        url: '/about',
        templateUrl: 'views/about.html',
        controller: 'MainCtrl',
        pageTitle: 'About',
      });
  })
  .run(function ($rootScope, $window, $http) {
    var init;
    if (
      typeof $window.localStorage.api === 'undefined' ||
      $window.localStorage.api === ''
    ) {
      $rootScope.api = '/api/v1.0/';// Old default http://localhost:1337
    } else {
      $rootScope.api = $window.localStorage.api;
    }
    init = function () {
      $http.get($rootScope.api + 'browse').
      success(function (data, status) {
        if (status === 200) {
          $rootScope.categories = data;
        }
      }).
      error(function () {
        // Error!
      });
      $http.get($rootScope.api + 'stats').
      success(function (data, status) {
        var index;
        if (status === 200) {
          $rootScope.stats = data;
          $rootScope.magnetTrackers = '';
          for (index = 0; index < data.Trackers.length; ++index) {
            $rootScope.magnetTrackers = $rootScope.magnetTrackers +
              '&tr=' +
              data.Trackers[index];
          }
          $rootScope.magnetTrackers = $rootScope.magnetTrackers
            .replace(/\//g, '%2F');
          $rootScope.magnetTrackers = $rootScope.magnetTrackers
            .replace(/:/g, '%3A');
        } else {
          $rootScope.message = data.message;
        }
      }).
      error(function () {
        $rootScope.message = 'API Request failed.';
      });
    };
    $rootScope.clearMessage = function () {
      $rootScope.message = null;
    };
    init();
  });
