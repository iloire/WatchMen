(function () {

  'use strict';


  var watchmenControllers = angular.module('watchmenControllers');

  /**
   * Add service
   */

  watchmenControllers.controller('ServiceAddCtrl',
    function (
        $scope,
        $state,
        $filter,
        $stateParams,
        Service,
        Report
    ) {
      $scope.service = new Service();

      $scope.editServiceTitle = "New service";
      // defaults
      $scope.service.timeout = 10000;
      $scope.service.warningThreshold = 5000;
      $scope.service.interval = 60000;
      $scope.service.failureInterval = 30000;
      $scope.service.failuresToBeOutage = 1;
      $scope.service.port = 80;
      $scope.service.pingServiceName = 'http-head';
      $scope.service.tags = '';

      $scope.save = function () {

        $scope.service.pingServiceOptions = {};
        $scope.service.pingServiceOptions[$scope.service.pingServiceName] = $scope.selectedPingServiceOptions;

        $scope.service.$save(function () {
          Report.clearCache();
          $state.go('services');
        }, function(response){
          console.error(response);
          if (response && response.data && response.data.errors) {
            $scope.serviceAddErrors = response.data.errors;
          }
        });
      };

      $scope.cancel = function () {
        $state.go('services');
      };

    });

})();
