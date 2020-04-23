var request = require('supertest');
var assert = require('assert');
var express = require('express');
var passport = require('passport');
var mockPassport = require('passport-mock');
var superAgentAssertions = require('./lib/util/super-agent-assertions');
var storageFactory = require('../lib/storage/storage-factory');
var async = require('async');
var sinon = require('sinon');

var storage = storageFactory.getStorageInstance('test');
var app = require('../webserver/app')(storage);

describe('report route', function () {

  var server;
  var PORT = 3355;
  var validService;

  var SECOND = 1000;
  var MINUTE = SECOND * 60; //ms
  var HOUR = MINUTE * 60; //ms
  var INITIAL_TIME = 946684800000;
  var clock;

  var USERS = [
    {id: 1, email: 'admin@domain.com', isAdmin: true},
    {id: 2, email: 'user@domain.com', isAdmin: false}
  ];

  var API_ROOT = '/api/report';

  var agent = request.agent(app);

  function addOutageRecords(service, outageData, outageDuration, outageInterval, callback) {
    function addOutage(outage, cb) {
      outage.timestamp = +new Date();
      storage.startOutage(service, outage, function (err) {
        assert.ifError(err);
        clock.tick(outageDuration);
        storage.archiveCurrentOutageIfExists(service, function (err) {
          clock.tick(outageInterval);
          cb();
        });
      });
    }

    async.eachSeries(outageData, addOutage, callback);
  }

  function testOnServiceWithOutages(url, done, callback) {
    storage.addService(validService, function (err, id) {
      assert.ifError(err);
      validService.id = id;
      var outageData = [];
      for (var i = 0; i < 12; i++) {
        outageData.push({error: 'my error'});
      }

      var outageDuration = 4 * MINUTE;
      var outageInterval = HOUR;

      addOutageRecords(validService, outageData, outageDuration, outageInterval, function () {
        agent
          .get(url)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .send()
          .end(function (err, res) {
            assert.ifError(err);
            callback(res);
            done(err);
          });
      });
    });
  }

  before(function (done) {

    var mock = mockPassport(passport, USERS);
    mock(app);

    server = app.listen(PORT, function () {
      if (server.address()) {
        console.log('starting server in port ' + PORT);
        done();
      } else {
        console.log('something went wrong... couldn\'t listen to that port.');
        process.exit(1);
      }
    });
  });

  after(function () {
    server.close();
  });

  beforeEach(function (done) {
    validService = {
      name: 'my new service',
      pingServiceName: 'http-head',
      url: 'http://apple.com',
      timeout: 10000,
      port: 80,
      interval: 60000,
      failureInterval: 30000,
      warningThreshold: 30000
    };

    clock = sinon.useFakeTimers(INITIAL_TIME);

    storage.flush_database(done);
  });

  describe('reporting a service', function () {

    describe('with an anonymous user', function () {

      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should not require auth', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.service.interval, validService.interval);
                done(err);
              });
        });
      });

      it('should not expose alertTo emails', function (done) {
        validService.alertTo = 'email1@domain.com';
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.service.interval, validService.interval);
                assert.ok(!res.body.service.alertTo);
                done(err);
              });
        });
      });

      it('should return 404 if the service does not exist', function (done) {
        superAgentAssertions.shouldReturnStatusCode(agent, {
          url : API_ROOT + '/services/22222',
          statusCode: 404
        }, done);
      });

      it('should have not access if restrictions are applied', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldReturnStatusCode(agent, {
            url : API_ROOT + '/services/' + id,
            statusCode: 404
          }, done);
        });
      });

    });

    describe('with an authenticated user', function () {

      beforeEach(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should have not access if restrictions are applied but user is not included', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          superAgentAssertions.shouldReturnStatusCode(agent, {
            url : API_ROOT + '/services/' + id,
            statusCode: 404
          }, done);
        });
      });

      it('should have access if restrictions include the current user', function (done) {
        validService.restrictedTo = "user@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                console.log(res.body)
                //assert.equal(res.body.service.isRestricted, true);
                done(err);
              });
        });
      });

      it('should not expose restrictedTo emails', function (done) {
        validService.restrictedTo = 'user@domain.com';
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services/' + id)
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.service.interval, validService.interval);
                assert.ok(!res.body.service.restrictedTo);
                done(err);
              });
        });
      });
    });
  });

  describe('loading all services', function () {

    describe('with an anonymous user', function () {

      beforeEach(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should not require auth', function (done) {
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 1);
                assert.ok(res.body[0].status);
                assert.equal(res.body[0].service.interval, validService.interval);
                done(err);
              });
        });
      });

      it('should have not access a particular service if restrictions are applied', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 0);
                done(err);
              });
        });
      });

      it('should not expose alertTo emails', function (done) {
        validService.alertTo = 'email1@domain.com';
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 1);
                assert.ok(!res.body[0].service.alertTo);
                done(err);
              });
        });
      });

    });

    describe('with an authenticated user', function () {

      beforeEach(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should have not access if restrictions are applied but user is not included', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 0);
                done(err);
              });
        });
      });

      it('should have access if restrictions include the current user', function (done) {
        validService.restrictedTo = "user@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 1);
                assert.equal(res.body[0].service.isRestricted, true);
                done(err);
              });
        });
      });
    });

    describe('with an admin user', function () {

      beforeEach(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should have access to all services', function (done) {
        validService.restrictedTo = "other@domain.com";
        storage.addService(validService, function (err, id) {
          assert.ifError(err);
          agent
              .get(API_ROOT + '/services')
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
              .send()
              .end(function (err, res) {
                assert.equal(res.body.length, 1);
                assert.equal(res.body[0].service.isRestricted, true);
                done(err);
              });
        });
      });
    });
  });

  describe('loading all outages', function () {

    describe('with an anonymous user', function () {
      before(function (done) {
        agent.get('/logout').expect(302, done);
      });

      it('should not require auth', function (done) {
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0',
          done,
          function (res) {
            assert.equal(res.body.length, 10);
            assert.equal(res.body[0].service, validService.id);
        });
      });
    });

    describe('with an authenticated normal user', function () {
      beforeEach(function (done) {
        agent.get('/login/test/2').expect(200, done);
      });

      it('should have not access if restrictions are applied but user is not included', function (done) {
        validService.restrictedTo = "other@domain.com";

        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0',
          done,
          function (res) {
            assert.equal(res.body.length, 0);
          }
        );
      });

      it('should have access if restrictions include the current user', function (done) {
        validService.restrictedTo = "user@domain.com";
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0',
          done,
          function (res) {
            assert.equal(res.body.length, 10);
          }
        );
      });

      it('should respect the max-items parameter', function (done) {
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0&max-items=5',
          done,
          function (res) {
            assert.equal(res.body.length, 5);
          }
        );
      });

      it('should respect the max-items-per-service parameter', function (done) {
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0&max-items-per-service=4',
          done,
          function (res) {
            assert.equal(res.body.length, 4);
          }
        );
      });

      it('should respect the grouping parameter', function (done) {
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0&grouping=1',
          done,
          function (res) {
            assert.ok(Array.isArray(res.body[validService.id]));
            assert.equal(res.body[validService.id].length, 10);
          }
        );
      });
    });

    describe('with an authenticated admin user', function () {
      beforeEach(function (done) {
        agent.get('/login/test/1').expect(200, done);
      });

      it('should have access to all services', function (done) {
        testOnServiceWithOutages(
          API_ROOT + '/services/outages?since=0',
          done,
          function (res) {
            assert.equal(res.body.length, 10);
          }
        );
      });
    });
  });
});
