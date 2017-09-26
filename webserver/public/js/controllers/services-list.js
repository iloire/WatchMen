(function () {

    'use strict';

    var SERVICES_POLLING_INTERVAL = 60000;
    var timer;

    var watchmenControllers = angular.module('watchmenControllers');

    window.localStorage.setItem("filterRestrictedToMe", "false");
    window.localStorage.setItem("filterRestrictedStage01", "false");
    window.localStorage.setItem("filterRestrictedStage02", "false");
    window.localStorage.setItem("filterRestrictedStage03", "false");

    watchmenControllers.controller('ServiceListCtrl',
        function (
            $scope,
            $filter,
            $timeout,
            Report,
            Service,
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
                $scope.services = Report.query(function (services) {
                    $scope[key] = services;
                    $scope.tableParams.reload();

                    $scope.errorLoadingServices = null; // reset error
                    transition.loaded();
                    doneCb();
                }, errorHandler);
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


            var filterToMeCheckboxIsPresent = document.getElementById('filterRestrictedToMe');
            var filterStage01CheckboxIsPresent = document.getElementById('filterRestrictedStage01');
            var filterStage02CheckboxIsPresent = document.getElementById('filterRestrictedStage02');
            var filterStage03CheckboxIsPresent = document.getElementById('filterRestrictedStage03');
            //var filterStage03CheckboxIsPresent = document.getElementById('filterRestrictedStage03');
            console.log("filterToMeCheckboxIsPresent : "+filterToMeCheckboxIsPresent);

            if (filterToMeCheckboxIsPresent && window.localStorage) {
                var filterToMeStoredValue = (window.localStorage.getItem('filterRestrictedToMe') === 'true');
                $timeout(function(){
                    filterToMeCheckboxIsPresent.checked = filterToMeStoredValue;
                    $scope.filterRestrictedToMe = filterToMeStoredValue;
                }, 0);
            }

            if (filterStage01CheckboxIsPresent && window.localStorage) {
                var filterStage01StoredValue = (window.localStorage.getItem('filterRestrictedStage01') === 'true');
                $timeout(function(){
                    filterStage01CheckboxIsPresent.checked = filterStage01StoredValue;
                    $scope.filterRestrictedStage01 = filterStage01StoredValue;
                }, 0);
            }
            if (filterStage02CheckboxIsPresent && window.localStorage) {
                var filterStage02StoredValue = (window.localStorage.getItem('filterRestrictedStage02') === 'true');
                $timeout(function(){
                    filterStage02CheckboxIsPresent.checked = filterStage02StoredValue;
                    $scope.filterRestrictedStage02 = filterStage02StoredValue;
                }, 0);
            }
            if (filterStage03CheckboxIsPresent && window.localStorage) {
                var filterStage03StoredValue = (window.localStorage.getItem('filterRestrictedStage03') === 'true');
                $timeout(function(){
                    filterStage03CheckboxIsPresent.checked = filterStage03StoredValue;
                    $scope.filterRestrictedStage03 = filterStage03StoredValue;
                }, 0);
            }

            $scope.$watch('filterRestrictedToMe',
                function (newValue) {
                    console.log("****** Restricted Search Prod %%%%")
                    if (window.localStorage) {
                        window.localStorage.setItem('filterRestrictedToMe', newValue);
                    }
                }
            );

            $scope.$watch('filterRestrictedStage01',
                function (newValue) {
                    if (window.localStorage) {
                        window.localStorage.setItem('filterRestrictedStage01', newValue);
                    }
                }
            );

            $scope.$watch('filterRestrictedStage02',
                function (newValue) {
                    if (window.localStorage) {
                        window.localStorage.setItem('filterRestrictedStage02', newValue);
                    }
                }
            );

            $scope.$watch('filterRestrictedStage03',
                function (newValue) {
                    if (window.localStorage) {
                        window.localStorage.setItem('filterRestrictedStage03', newValue);
                    }
                }
            );

            transition.loading();

            $scope.serviceFilter = function (row) {
                if ($scope.filterRestrictedToMe && !row.service.isRestricted) {
                    return (row.service.restrictedToEnv == 'PROD') ? row.service.name.toLowerCase().indexOf($scope.query||"")> -1 : false
                }
                if ($scope.filterRestrictedStage01 && !row.service.isRestricted) {
                    return (row.service.restrictedToEnv == 'STAGE01') ? row.service.name.toLowerCase().indexOf($scope.query||"")> -1 : false
                }
                if ($scope.filterRestrictedStage02 && !row.service.isRestricted) {
                    return (row.service.restrictedToEnv == 'STAGE02') ? row.service.name.toLowerCase().indexOf($scope.query||"")> -1 : false
                }
                if ($scope.filterRestrictedStage03 && !row.service.isRestricted) {
                    return (row.service.restrictedToEnv == 'STAGE03') ? row.service.name.toLowerCase().indexOf($scope.query||"")> -1 : false
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

            reload(scheduleNextTick, loadServicesErrHandler);

        });

})();
