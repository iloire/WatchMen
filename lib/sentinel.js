var _ = require('lodash');
var debug = require('debug')('sentinel');

/**
 * Watches for changes in services to restart them when they change.
 */

function Sentinel(storage, watchmen, options) {
  this.options = options || {};
  this.storage = storage;
  this.watchmen = watchmen;
}

exports = module.exports = Sentinel;

var DEFAULT_INTERVAL = 5000;
var FIELDS_WHICH_MODIFICATION_TRIGGER_SERVICE_RESTART = [
  'name',
  'interval',
  'failureInterval',
  'failuresToBeOutage',
  'port',
  'url',
  'timeout',
  'alertTo',
  'pingServiceName',
  'pingServiceOptions',
  'warningThreshold',
  'isPaused'
];
var timeoutId = null;

Sentinel.prototype._findAdded = function (databaseServices, runningServices) {
  var added = [];
  databaseServices.forEach(function (s) {
    if (!_.find(runningServices, function (rs) {
          return rs.id == s.id;
        }) && !s.isPaused) {
      added.push(s);
    }
  });
  return added;
};

Sentinel.prototype._findRemoved = function (databaseServices, runningServices) {
  var removed = [];
  runningServices.forEach(function (runningService) {
    if (!_.find(databaseServices, function (s) {
          return s.id == runningService.id;
        })) {
      removed.push(runningService);
    }
  });
  return removed;
};

function propertyModified(propDb, propService) {
  return JSON.stringify(propDb) !== JSON.stringify(propService);
}

Sentinel.prototype._findModified = function (databaseServices, runningServices) {
  var modified = [];
  runningServices.forEach(function (runningService) {
    var dbService = _.find(databaseServices, function (rs) {
      return rs.id == runningService.id;
    });
    if (dbService) {
      for (var key in dbService) {
        if (FIELDS_WHICH_MODIFICATION_TRIGGER_SERVICE_RESTART.indexOf(key) > -1) {
          if (propertyModified(dbService[key], runningService[key])) {

            debug('property ' + key + ' from service ' + dbService.name + ' changed.');
            debug('db:');
            debug(dbService[key]);
            debug('running service:');
            debug(runningService[key]);

            modified.push(dbService);
            break;
          }
        }
        else {
          debug('detected changed in field ' + key + '. Ignored');
        }
      }
    }
  });
  return modified;
};

Sentinel.prototype._tick = function () {

  var self = this;
  this.storage.getServices({}, function (err, services) {

    var newServices = self._findAdded(services, self.watchmen.services);
    if (newServices.length) {
      newServices.forEach(function (service) {
        console.log('service added: ', service.name);
        self.watchmen.addService(service);
      });
    }

    var removedServices = self._findRemoved(services, self.watchmen.services);
    if (removedServices.length) {
      removedServices.forEach(function (s) {
        self.watchmen.removeService(s.id);
        console.log('service removed: ', s.name);
      });
    }

    var modifiedServices = self._findModified(services, self.watchmen.services);
    if (modifiedServices.length) {
      modifiedServices.forEach(function (s) {
        self.watchmen.removeService(s.id);
        if (!s.isPaused) {
          self.watchmen.addService(s);
        }
        console.log('changes detected in service: ', s.name, '. Restarting...');
      });
    }
  });
};

Sentinel.prototype.watch = function () {
  var self = this;
  clearInterval(timeoutId);
  timeoutId = setInterval(function () {
    self._tick();
  }, this.options.interval || DEFAULT_INTERVAL);
};

