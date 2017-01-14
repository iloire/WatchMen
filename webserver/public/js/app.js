(function(){

    'use strict';

    /* App Module */

    var watchmenApp = angular.module('watchmenApp', [
        'ui.router',
        'angularSpinner',
        'ngTable', // table sorting and pagination
        'angularMoment',
        'angularMSTime',
        'watchmenControllers',
        'watchmenDirectives',
        'watchmenFactories',
        'ngResource'
    ]);

    watchmenApp.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
	
        $locationProvider.html5Mode(true);

        $stateProvider.state('services', {
            url: '/services',
            templateUrl: 'service-list.html',
            controller: 'ServiceListCtrl'
        }).state('viewService', {
            url: '/services/:id/view',
            templateUrl: 'service-detail.html',
            controller: 'ServiceDetailCtrl'
        }).state('newService', {
            url: '/services/add',
            templateUrl: 'service-edit.html',
            controller: 'ServiceAddCtrl'
        }).state('editService', {
            url: '/services/:id/edit',
            templateUrl: 'service-edit.html',
            controller: 'ServiceEditCtrl'
        });

        $urlRouterProvider.when('/', '/services');
    });

})();
