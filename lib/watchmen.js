var events = require('events');
var moment = require('moment');
var debug = require('debug')('watchmen');
var util = require('util');
var utils = require('./utils');

exports = module.exports = WatchMen;

/**
 * Watchmen service
 * @param services {Array} list of services to ping
 * @param storage {Object} storage instance
 * @constructor
 */

function WatchMen(services, storage) {
  this.storage = storage;
  this.services = services;
}

util.inherits(WatchMen, events.EventEmitter);

/**
 * Ping service
 * @param params.service {Object} service object
 * @param callback {Function} ping result callback
 */

WatchMen.prototype.ping = function (params, callback) {

  var self = this;
  var storage = self.storage;
  var service = params.service;

  debug('pinging ' + service.name);

  if (!service.pingService) {
    var pingFactory = require('watchmen-ping-' + service.pingServiceName);
    service.pingService = new pingFactory();
  }

  service.pingService.ping(service, function (error, body, response, elapsedTime) {

    var timestamp = +new Date();

    self.emit('ping', service, {elapsedTime: elapsedTime});

    if (error) {

      /**
       * Ops, ping failed!
       */

      debug('error', error);

      var nPingsToBeConsideredOutage = isNaN(service.failuresToBeOutage) ? 1 : service.failuresToBeOutage;

      debug('failure threshold', nPingsToBeConsideredOutage);

      storage.increaseOutageFailureCount(service, function (err, currentFailureCount) {
        if (err) {
          return callback(err);
        }

        debug('currentFailureCount', currentFailureCount);

        self.emit('service-error', service, {
          error: error,
          currentFailureCount: currentFailureCount
        });

        storage.getCurrentOutage(service, function (err, outage) {
          if (err) {
            return callback(err);
          }

          if (!outage) {

            /**
             * First failure
             */

            if (currentFailureCount >= nPingsToBeConsideredOutage) {
              var outageData = {
                timestamp: timestamp,
                error: error
              };
              storage.startOutage(service, outageData, function (err) {
                if (err) {
                  return callback(err);
                }
                self.emit('new-outage', service, outageData);
                callback(null, service.failureInterval);
              });
            } else {
              callback(null, service.failureInterval);
            }

          } else {

            /**
             * Not the first ping failure for this outage
             */

            self.emit('current-outage', service, outage);
            callback(null, service.failureInterval);
          }
        });

      });
    } else {

      /**
       * (thumbsup), ping succeed!
       */

      debug('success');

      storage.resetOutageFailureCount(service, function (err) {
        if (err) {
          return callback(err);
        }

        var limit = service.warningThreshold;
        if (limit && (elapsedTime > limit)) { //over the limit. warning!
          self.emit('latency-warning', service, {elapsedTime: elapsedTime});
        }

        storage.saveLatency(service, timestamp, elapsedTime, function (err) {
          if (err) {
            return callback(err);
          }

          debug('latency was', elapsedTime);

          storage.archiveCurrentOutageIfExists(service, function (err, currentOutage) {
            if (err) {
              return callback(err);
            }

            if (currentOutage) {
              debug('emit current outage');
              self.emit('service-back', service, currentOutage);
            }

            self.emit('service-ok', service, {elapsedTime: elapsedTime});

            callback(null, service.interval);
          });
        });
      });
    }

  });
};

WatchMen.prototype._launch = function (service) {
  var self = this;
  this.ping({service: service}, function (err, nextDelay) {
    if (err) {
      console.error(err);
    }
    if (service.running) {
      service.timeoutId = setTimeout(function () {
        self._launch(service);
      }, nextDelay);
    }
  });
};


/**
 * Starts all
 * @param options.randomDelayOnInit max bound for a random delay when starting services, to avoid
 * an initial load peak
 */

WatchMen.prototype.startAll = function (options) {
  var self = this;

  var delay = 0;
  options = options || {};
  if (!isNaN(options.randomDelayOnInit)) {
    delay = utils.getRandomInt(0, options.randomDelayOnInit);
    debug('Using a delay of max. ', options.randomDelayOnInit, 'ms. on service initialisation');
  }

  this.services.forEach(function (service) {
    if (!service.running && !service.isPaused) {
      setTimeout(function(){
        self._launch(service);
        service.running = true;
      }, delay);
    }
  });
};

/**
 * Stops all
 */

WatchMen.prototype.stopAll = function () {
  var self = this;
  this.services.forEach(function (service) {
    if (service.running) {
      self.stop(service.id);
    }
  });
};

/**
 * Starts one service
 */

WatchMen.prototype.start = function (id) {
  var service = this.getServiceById(id);
  if (!id || !service) {
    throw new Error('invalid service id');
  } else {
    if (!service.running) {
      service.running = true;
      this._launch(service);
    }
  }
};

/**
 * Stops one service
 */

WatchMen.prototype.stop = function (id) {
  var service = this.getServiceById(id);
  if (!id || !service) {
    throw new Error('invalid service id');
  } else {
    clearTimeout(service.timeoutId);
    service.running = false;
  }
};

/**
 * Add service to the list of running services
 */

WatchMen.prototype.addService = function (service) {
  this.services.push(service);
  this.start(service.id);
};

/**
 * Remove service from the list of running services
 */

WatchMen.prototype.removeService = function (id) {
  if (!id) throw new Error('no id provided');

  var pos = this.services.map(function (s) {
    return s.id;
  }).indexOf(id);

  if (pos == -1) {
    throw new Error('service with id ' + id + ' not found');
  } else {
    this.stop(id);
    this.services.splice(pos, 1);
  }
};

/**
 * Get service by id
 * @param serviceId
 * @returns {object} Service
 */

WatchMen.prototype.getServiceById = function (id) {
  return this.services.filter(function (s) {
    return s.id == id;
  })[0];
};