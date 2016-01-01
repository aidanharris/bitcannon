'use strict';

/**
 * @ngdoc function
 * @name bitCannonApp.controller:TorrentCtrl
 * @description
 * # TorrentCtrl
 * Controller of the bitCannonApp
 */
angular.module('bitCannonApp')
  .controller('TorrentCtrl',
    function ($rootScope, $scope, $stateParams, $http) {
      var init = function () {
        $http.get($rootScope.api + 'torrent/' + $scope.btih).
        success(function (data, status) {
          if (status === 200) {
            document.getElementsByTagName('title')[0].innerHTML =
              'BitCannon - ' +
              data.Title;
            $scope.torrent = data;
            $scope.torrent.Size = $scope.torrent.Size / 1048576;
            if ($scope.torrent.Size > 1024) {
              $scope.torrent.Size = String(
                ($scope.torrent.Size / 1024).toFixed(2) +
                ' gigabytes');
            } else {
              $scope.torrent.Size = String(
                ($scope.torrent.Size).toFixed(2) +
                ' megabytes');
            }
          } else {
            $rootScope.message = data.message;
          }
        }).
        error(function () {
          $rootScope.message = 'API Request failed.';
        });
      };

      $scope.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma',
      ];

      $scope.btih = $stateParams.btih;

      $scope.refreshing = false;
      $scope.refresh = function () {
        if ($scope.refreshing) {
          console.log('ignored duplicate refresh request');
          return;
        }
        $scope.refreshing = true;
        $http.get($rootScope.api + 'scrape/' + $scope.btih).
        success(function (data, status) {
          if (status === 200) {
            $scope.refreshing = false;
            $scope.torrent.Swarm = data.Swarm;
            $scope.torrent.Lastmod = data.Lastmod;
          } else {
            $scope.refreshing = false;
            $rootScope.message = data.message;
          }
        }).
        error(function () {
          $scope.refreshing = false;
          $rootScope.message = 'API Request failed.';
        });
      };
      init();
    }
  );
