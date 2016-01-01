'use strict';

/**
 * @ngdoc function
 * @name bitCannonApp.controller:BrowseCtrl
 * @description
 * # BrowseCtrl
 * Controller of the bitCannonApp
 */
angular.module('bitCannonApp')
  .controller('BrowseCtrl', function ($rootScope, $scope, $state) {
    if ($state.current.pageTitle !== undefined) {
      document.getElementsByTagName('title')[0].innerHTML =
        'BitCannon - ' +
        $state.current.pageTitle;
    }
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma',
    ];
  });
