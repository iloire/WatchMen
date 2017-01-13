var request = require('supertest');
var assert = require('assert');
var storageFactory = require('../lib/storage/storage-factory');

var storage = storageFactory.getStorageInstance('test');
var app = require('../webserver/app')(storage);

describe('ping plugins route', function () {

  var server;
  var PORT = 3355;

  var API_ROOT = '/api/plugins';

  var agent = request.agent(app);

  before(function (done) {

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

  describe('plugin list', function () {

    describe('with an anonymous user ', function () {

      it('should return list of plugins', function (done) {
        agent
            .get(API_ROOT + '/')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .send()
            .end(function (err, res) {
              assert(res.body.length > 2);
              var plugins = res.body.sort(function(a, b){ return a.name > b.name; });  
              assert(plugins.some(function(e) { return e.name == 'http-contains'; }));
              assert(plugins.some(function(e) { return e.name == 'http-head'; }));
              done(err);
            });
      });

    });

  });

});