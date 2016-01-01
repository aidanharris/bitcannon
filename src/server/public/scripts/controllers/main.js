'use strict';

/**
 * @ngdoc function
 * @name bitCannonApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bitCannonApp
 */
angular.module('bitCannonApp')
  .controller('MainCtrl', function ($scope, $state) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma',
    ];
    if ($state.current.pageTitle !== undefined) {
      document.getElementsByTagName('title')[0].innerHTML =
        'BitCannon - ' +
        $state.current.pageTitle;
    }
    $scope.submit = function () {
      if ($scope.query) {
        if ($scope.selectedCategory) {
          $state.go('searchCategory', {
            query: $scope.query,
            category: $scope.selectedCategory.name,
          });
        } else {
          $state.go('search', {
            query: $scope.query,
          });
        }
      }
    };
  });
