(function () {

  'use strict';

  var SERVICES_POLLING_INTERVAL = 10000;
  var timer;

  var watchmenControllers = angular.module('watchmenControllers');

  watchmenControllers.controller('ServiceListCtrl',
      function (
          $scope,
          $filter,
          $timeout,
          Report,
          Service,
          Tags,
          usSpinnerService,
          ngTableUtils
      ) {

        function scheduleNextTick() {
          $timeout.cancel(timer);
          timer = $timeout(function () {
            reload(scheduleNextTick, loadServicesErrHandler);
          }, SERVICES_POLLING_INTERVAL);
        }

        function loadServicesErrHandler(err) {
          $scope.errorLoadingServices = "Error loading data from remote server";
          console.error(err);
          scheduleNextTick();
        }

        function reload(doneCb, errorHandler) {
          Report.clearCache();
          $scope.services = Report.query({
              tags: $scope.currentTags
          }, function (services) {
            $scope[key] = services;
            $scope.tableParams.reload();

            $scope.errorLoadingServices = null; // reset error
            transition.loaded();
            doneCb();
          }, errorHandler);

          Tags.query(function(tags) {
            $scope.tags = tags;
          })

        }

        var transition = {
          loading: function () {
            usSpinnerService.spin('spinner-1');
            $scope.loading = true;
          },
          loaded: function () {
            usSpinnerService.stop('spinner-1');
            $scope.loading = false;
          }
        };

        var key = 'tableServicesData';
        $scope[key] = [];
        $scope.tableParams = ngTableUtils.createngTableParams(key, $scope, $filter);
        $scope.currentTags = [];

        var filterToMeCheckboxIsPresent = document.getElementById('filterRestrictedToMe');
        if (filterToMeCheckboxIsPresent && window.localStorage) {
          var filterToMeStoredValue = (window.localStorage.getItem('filterRestrictedToMe') === 'true');
          $timeout(function(){
            filterToMeCheckboxIsPresent.checked = filterToMeStoredValue;
            $scope.filterRestrictedToMe = filterToMeStoredValue;
          }, 0);
        }

        $scope.$watch('filterRestrictedToMe',
            function (newValue) {
              if (window.localStorage) {
                window.localStorage.setItem('filterRestrictedToMe', newValue);
              }
            }
        );

        transition.loading();

        $scope.serviceFilter = function (row) {
          if ($scope.filterRestrictedToMe && !row.service.isRestricted) {
            return false;
          }
          return row.service.name.indexOf($scope.query || '') > -1;
        };

        $scope.delete = function (id) {
          if (confirm('Are you sure you want to delete this service and all its data?')) {
            Service.delete({id: id}, function () {
              reload(function () {
              }, function () {
                $scope.errorLoadingServices = "Error loading data from remote server";
              });
            });
          }
        };

        $scope.reset = function (id) {
          if (confirm('Are you sure you want to reset this service\'s data?')) {
            Service.reset({id: id}, function () {
              reload(function () {
              }, function () {
                $scope.errorLoadingServices = "Error loading data from remote server";
              });
            });
          }
        };

          /**
           * Defines if a tag is currently active
           * @param tag
           * @returns {boolean}
           */
        $scope.isActiveTag = function(tag) {
          return $scope.currentTags.includes(tag);
        };

        $scope.toggleTag = function(tag) {
          if ($scope.currentTags.includes(tag)) {
            $scope.currentTags = $scope.currentTags.filter(function(curTag) {
              return curTag !== tag;
            })
          } else {
            $scope.currentTags.push(tag);
          }
          reload(function () {
          }, function () {
            $scope.errorLoadingServices = "Error loading data from remote server";
          });
        };

        reload(scheduleNextTick, loadServicesErrHandler);

      });

})();
