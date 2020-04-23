var assert = require ('assert');
var async = require('async');
var sinon = require('sinon');

var storageFactory = require ('../lib/storage/storage-factory');
var redisStorage = storageFactory.getStorageInstance('test');

describe('redis storage', function(){

  var service;
  var clock;
  var INITIAL_TIME = 946684800;

  beforeEach(function(done){
    clock = sinon.useFakeTimers(INITIAL_TIME);
    service = {
      name: 'a service',
      interval: 1000
    };
    redisStorage.flush_database(function(){
      redisStorage.addService(service, done);
    });
  });

  after(function(done){
    if (clock) {
      clock.restore();
    }
    done();
  });

  describe('services', function(){
    it('should save and retrieve service object', function(done) {
      var newService = {
        interval: 1000,
        tags: 'tag1, tag2'
      };
      redisStorage.addService(newService, function(err, id){
        redisStorage.getService(id, function(err, service) {
          assert.equal(service.id, id);
          assert.equal(service.created, INITIAL_TIME);
          assert.deepEqual(service.tags, [ 'tag1' , 'tag2' ]);
          done();
        });
      });
    });

    it('should update service', function(done) {
      var newService = {
        interval: 1000,
        tags: ['tag1', 'tag2', 'tag1']
      };
      redisStorage.addService(newService, function(err, id){
        redisStorage.getService(id, function(err, service) {
          assert.equal(service.id, id);
          assert.equal(service.interval, 1000);
          assert.deepEqual(service.tags, [ 'tag1' , 'tag2' ]);
          service.interval = 2000;
          service.tags.push('tag3')
          redisStorage.updateService(service, function(err, service) {
            assert.equal(service.interval, 2000);
            assert.deepEqual(service.tags, [ 'tag1' , 'tag2', 'tag3' ]);
            done();
          });
        });
      });
    });

    it('should delete service object', function(done) {
      var newService = {
        interval: 1000
      };
      redisStorage.addService(newService, function(err, id){
        redisStorage.getService(id, function(err, service) {
          assert.equal(service.interval, 1000);
          redisStorage.deleteService(id, function(err){
            redisStorage.getService(id, function(err, service) {
              assert.equal(service, null);
              done();
            });
          });
        });
      });
    });

    it('should return all services', function(done) {
      var newService1 = {
        interval: 2000,
        name: 'b service'
      };
      var newService2 = {
        interval: 3000,
        name: 'c service'
      };
      redisStorage.addService(newService1, function(err){
        assert.ifError(err);
        redisStorage.addService(newService2, function(err){
          assert.ifError(err);
          redisStorage.getServices({}, function(err, data){
            assert.ifError(err);
            data.sort(function(a, b){
              return a.name > b.name;
            });
            assert.equal(data[0].interval, 1000);
            assert.equal(data[1].interval, 2000);
            assert.equal(data[2].interval, 3000);
            done();
          });
        });
      });
    });

  });


  describe('outages', function(){
    it('should set and get current outage successfully', function(done) {
      var outageData = {
        timestamp: +new Date(),
        error: 'my error'
      };
      redisStorage.startOutage(service, outageData, function(err){
        assert.ifError(err);
        redisStorage.getCurrentOutage(service, function(err, outage){
          assert.equal(outage.error, 'my error');
          done();
        });
      });
    });

    it('should archive current outage', function(done) {
      var outageData = {
        timestamp: +new Date() - 1000,
        error: 'my error'
      };
      redisStorage.startOutage(service, outageData, function(err){
        assert.ifError(err);
        redisStorage.archiveCurrentOutageIfExists(service, function(err, outage){
          assert.ok(outage);
          assert.equal(outage.error, 'my error');
          assert.equal(outage.downtime, 1000, 'should record downtime');
          redisStorage.getCurrentOutage(service, function(err, NoMoreOutage){
            assert.ok(!NoMoreOutage);
            redisStorage.getServiceOutagesSince(service, +new Date() - 2000, function(err, outages){
              assert.equal(outages.length, 1, 'should have 1 outage');
              assert.equal(outages[0].downtime, 1000, 'should record downtime');
              done();
            });
          });
        });
      });
    });
  });

  describe('latency', function() {
    it('should store and retrieve latency', function(done) {
      redisStorage.saveLatency(service, +new Date() - 100, 200, function(err){
        assert.ifError(err);
        redisStorage.saveLatency(service, +new Date(), 100, function(err){
          assert.ifError(err);
          redisStorage.getLatencySince(service, null, null, function(err, results){
            assert.ifError(err);
            assert.equal(results.arr[0].l, 100);
            assert.equal(results.arr[1].l, 200);
            assert.equal(results.mean, 150);
            done();
          });
        });
      });
    });

    it('should retrieve latency in old or new format', function(done) {
      var time = +new Date();
      var multi = redisStorage.redis.multi();
      //old format (memeber = elapsed)
      multi.zadd(service.id+':'+'latency', time-300, 100);
      multi.zadd(service.id+':'+'latency', time-200, 200);
      //new format (member = timestamp:elapsed)
      multi.zadd(service.id+':'+'latency', time-100, (time-100)+':'+300);
      multi.zadd(service.id+':'+'latency', time, time+':'+400);
      multi.exec(function(err){
        assert.ifError(err);
        redisStorage.getLatencySince(service, null, null, function(err, results){
          assert.ifError(err);
          assert.equal(results.arr[0].l, 400);
          assert.equal(results.arr[1].l, 300);
          assert.equal(results.arr[2].l, 200);
          assert.equal(results.arr[3].l, 100);
          assert.equal(results.mean, 250);
          done();
        });
      });

    });
  });
});
