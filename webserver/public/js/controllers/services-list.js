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
                console.log("aya");
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


            window.localStorage.setItem("filterRestrictedToALL", "true");


            var filterRestrictedTO = document.getElementById('filterRestrictedTO').value;



            $scope.$watch('filterRestrictedTO',
                function (newValue) {
                    window.localStorage&&window.localStorage.setItem('filterRestrictedTO', newValue);
                }
            );

            transition.loading();

            $scope.serviceFilter = function(row) {
                if (filterRestrictedTO == 'PROD' ) {
                    return (row.service.restrictedToEnv == 'PROD') ? row.service.name.toLowerCase().indexOf($scope.query||'')> -1 : false
                }
                if (filterRestrictedTO == 'QA') {
                    return (row.service.restrictedToEnv == 'QA') ? row.service.name.toLowerCase().indexOf($scope.query||'')> -1 : false
                }
                if (filterRestrictedTO == 'UAT') {
                    return (row.service.restrictedToEnv == 'UAT') ? row.service.name.toLowerCase().indexOf($scope.query||'')> -1 : false
                }
                if (filterRestrictedTO == 'STAGE') {
                    return (row.service.restrictedToEnv == 'STAGE') ? row.service.name.toLowerCase().indexOf($scope.query||'')> -1 : false
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
