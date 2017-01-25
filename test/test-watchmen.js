var sinon = require('sinon');
var assert = require('assert');
var Watchmen = require('../lib/watchmen');
var mockedStorage = require('./lib/mock/storage-mocked');
var mockedPing = require('./lib/mock/request-mocked');

describe('watchmen', function () {

  var ERROR_RESPONSE = {error: 'mocked error', body: null, response: null, latency: 0};
  var SUCCESS_RESPONSE = {error: null, body: 'ok', response: {body: 'ok', statusCode: 200}, latency: 300};
  var LATENCY_WARNING_RESPONSE = {error: null, body: 'ok', response: {body: 'ok', statusCode: 200}, latency: 1600};
  var INITIAL_TIME = 946684800;

  var service;
  var clock;

  var noop = function () {};

  beforeEach(function () {
    clock = sinon.useFakeTimers(INITIAL_TIME);
    service = {
      id: 'X34dF',
      host: {host: 'www.correcthost.dev', port: '80', name: 'test'},
      url: '/',
      interval: 4 * 1000,
      failureInterval: 5 * 1000,
      warningThreshold: 1500,
      pingService: mockedPing
    };
  });

  afterEach(function (done) {
    if (clock) {
      clock.restore();
    }
    done();
  });

  describe('event emitter',function(){

    it('should emit "new-outage" when ping fails if "failuresToBeOutage" is not defined', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      var failedTimestamp = +new Date();

      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.on('new-outage', function (service, outageData) {
        assert.equal(outageData.error, 'mocked error', 'should have error property');
        assert.equal(outageData.timestamp, failedTimestamp, 'should have timestamp property');
        done();
      });
      watchmen.on('current-outage', function () {
        done('should not be called');
      });
      watchmen.ping({service: service, timestamp: failedTimestamp}, noop);
      clock.tick(ERROR_RESPONSE.latency);
    });

    it('should emit "new-outage" when number of failed pings is equal than "failuresToBeOutage"', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      service.failuresToBeOutage = 2;
      var failedTimestamp = +new Date();

      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.on('new-outage', function (service, outageData) {
        assert.equal(outageData.error, 'mocked error', 'should have error property');
        assert.equal(outageData.timestamp, failedTimestamp, 'should have timestamp property');
        done();
      });
      watchmen.on('current-outage', function () {
        done('should not be called');
      });
      watchmen.ping({service: service, timestamp: failedTimestamp}, noop);
      clock.tick(ERROR_RESPONSE.latency);
      watchmen.ping({service: service, timestamp: failedTimestamp}, noop);
      clock.tick(ERROR_RESPONSE.latency);
    });

    it('should emit "service-error" when ping fails', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      var failedTimestamp = +new Date();

      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.on('service-error', function (service, outageData) {
        assert.equal(outageData.error, 'mocked error', 'should have error property');
        assert.equal(outageData.currentFailureCount, 1, 'should have currentFailureCount');
        done();
      });
      watchmen.ping({service: service, timestamp: failedTimestamp}, noop);
      clock.tick(ERROR_RESPONSE.latency);
    });

    it('should ping next on failureInterval interval when check fails', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      var failedTimestamp = +new Date();

      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.ping({service: service, timestamp: failedTimestamp}, function(err, nextInterval){
        assert.equal(nextInterval, service.failureInterval);
        done();
      });
      clock.tick(ERROR_RESPONSE.latency);
    });

    it('should not emit "new-outage" when number of failed ping is less than "failuresToBeOutage"', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      service.failuresToBeOutage = 2;
      var failedTimestamp = +new Date();

      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.on('service-error', function () {
        done();
      });
      watchmen.on('new-outage', function () {
        done('should not be called');
      });
      watchmen.ping({service: service, timestamp: failedTimestamp}, noop);
      clock.tick(ERROR_RESPONSE.latency);
    });

    it('should emit "current-outage" when ping fails for the second and more times', function (done) {
      mockedPing.mockedResponse = ERROR_RESPONSE;
      var failedTimestamp = +new Date();
      var called = false;
      var watchmen = new Watchmen([service], new mockedStorage());
      watchmen.on('current-outage', function (service, outageData) {
        assert.equal(outageData.error, 'mocked error', 'should have error property');
        assert.equal(outageData.timestamp, failedTimestamp, 'should have timestamp property');
        called = true;
      });
      watchmen.ping({service: service, timestamp: failedTimestamp}, function () {
        watchmen.ping({service: service, timestamp: failedTimestamp}, function () {
          done(called ? null : 'current-outage was not called');
        });
        clock.tick(ERROR_RESPONSE.latency);
      });
      clock.tick(ERROR_RESPONSE.latency);
    });


    it('should emit "service-ok" when ping success', function (done) {
      mockedPing.mockedResponse = SUCCESS_RESPONSE;
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.on('service-ok', function (service, data) {
        assert.equal(data.elapsedTime, 300);
        done();
      });
      watchmen.ping({service: service}, noop);
      clock.tick(SUCCESS_RESPONSE.latency);
    });

    it('should always emit "ping" after a ping', function (done) {
      mockedPing.mockedResponse = SUCCESS_RESPONSE;
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.on('ping', function (service, data) {
        assert.equal(data.elapsedTime, 300);
        done();
      });
      watchmen.ping({service: service}, noop);
      clock.tick(SUCCESS_RESPONSE.latency);
    });

    it('should emit "service-back" when service is back', function (done) {
      mockedPing.mockedResponse = SUCCESS_RESPONSE;
      var currentOutage = {
        timestamp: +new Date(),
        error: 'some error'
      };

      var watchmen = new Watchmen([service], new mockedStorage({currentOutage: currentOutage}));
      watchmen.on('service-back', function (service, outageData) {
        assert.equal(outageData.timestamp, INITIAL_TIME);
        done();
      });
      watchmen.ping({service: service}, noop);
      clock.tick(SUCCESS_RESPONSE.latency);
    });

    it('should emit "warning" when ping takes too long', function (done) {
      mockedPing.mockedResponse = LATENCY_WARNING_RESPONSE;
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.on('latency-warning', function (service, data) {
        assert.equal(data.elapsedTime, 1600);
        done();
      });
      watchmen.ping({service: service}, noop);
      clock.tick(LATENCY_WARNING_RESPONSE.latency);
    });

  });

  describe('start', function(){

    it('should start all services', function (done) {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen._launch = function () {
        done(); // service ping is invoked
      };
      watchmen.startAll({ randomDelayOnInit: 1 });
      clock.tick(1);
      assert.ok(service.running);
    });

    it('should start a service by ID', function (done) {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen._launch = function(){
        done(); // service ping is invoked
      };
      watchmen.start(service.id);
      assert.ok(service.running);
    });

    it('should throw if ID is not provided', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function(){
        watchmen.start();
      });
    });

    it('should throw if invalid ID is provided', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function(){
        watchmen.start('4444444');
      });
    });

    it('should not throw errors if there are not services', function (done) {
      var watchmen = new Watchmen([], new mockedStorage(null));
      watchmen._launch = function(){
        done('not called');
      };
      watchmen.startAll();
      done();
    });

    it('should not throw errors if options are not provided', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.startAll();
    });

  });

  describe('stop', function(){

    it('should stop a service by ID', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.start(service.id);
      assert.ok(service.running);
      watchmen.stop(service.id);
      assert.ok(!service.running);
    });

    it('should stop all services', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen.start(service.id);
      assert.ok(service.running);
      watchmen.stopAll();
      assert.ok(!service.running);
    });

    it('should throw if ID is not provided', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function(){
        watchmen.stop();
      });
    });

    it('should throw if invalid ID is provided', function () {
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function(){
        watchmen.stop('3333333');
      });
    });

    it('should not throw errors if there are not services', function () {
      var watchmen = new Watchmen([], new mockedStorage(null));
      watchmen.stopAll();
    });
  });

  describe('add service', function(){
    it('should add service and start it', function(done){
      var newService = {
        id: 'X3333',
        host: {host: 'www.new-service.dev', port: '80', name: 'test'},
        url: '/',
        interval: 4 * 1000,
        failureInterval: 5 * 1000,
        warningThreshold: 1500,
        pingService: mockedPing
      };

      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen._launch = function () {
        done(); // service ping is invoked
      };
      watchmen.addService(newService);
      assert.equal(watchmen.services.length, 2);
    });
  });

  describe('remove service', function(){
    it('should throw error if service Id is not provided', function(){
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function() {
        watchmen.removeService();
      });
    });

    it('should throw error if the service Id is invalid', function(){
      var watchmen = new Watchmen([service], new mockedStorage(null));
      assert.throws(function() {
        watchmen.removeService('invalid-id');
      });
    });

    it('should stop and remove service', function(done){
      var watchmen = new Watchmen([service], new mockedStorage(null));
      watchmen._launch = function () {
        done('should not be invoked');
      };
      watchmen.removeService(service.id);
      assert.equal(watchmen.services.length, 0);
      watchmen.startAll();
      clock.tick(30000);
      done();
    });
  });

});