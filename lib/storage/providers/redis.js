var redis = require("redis");
var shortid = require('shortid');
var aggregator = require('../../aggregator');
var connectRedis = require('connect-redis');

var SERVICE_KEY_SUFIX = "service";
var SERVICES_KEY_SUFIX = "service";
var TAGS_KEY_SUFIX = "tags";
var LATENCY_KEY_SUFIX = "latency";
var CURRENT_OUTAGE_KEY_SUFIX = "outages:current";
var OUTAGES_KEY_SUFIX = "outages";
var FAILURE_COUNT_SUFIX = "failurecount";

function StorageRedis(options) {
  this.options = options || {};
  this.redis = redis.createClient(this.options.port || 6379, this.options.host || '127.0.0.1');
  this.redis.select(this.options.db || 0);
}

/**
 * Remove duplicates, change the string of tags to an array,
 * and updates the main list of tags
 */
function handleTags(service, multi) {
    if (service.tags) {
        if (!(service.tags instanceof Array)) {
            service.tags = service.tags.split(",");
        }
    } else {
        service.tags = []
    }

    service.tags.forEach(function(tag) {
        multi.sadd(TAGS_KEY_SUFIX, tag.trim());
    });

    // prevent duplicate tags
    var finalTags = [];
    service.tags.forEach(function (tag) {
        var t = tag.trim();
        if (!finalTags.indexOf(t) >= 0) finalTags.push(t)
    });
    service.tags = finalTags;
    return service;
}

exports = module.exports = StorageRedis;



/**
 * Add service
 * @param service
 * @param callback
 */

StorageRedis.prototype.addService = function (service, callback) {
  var id = shortid.generate();
  service.id = id;
  service.created = +new Date();
  var multi = this.redis.multi();
  multi.sadd(SERVICES_KEY_SUFIX, id);

  service = handleTags(service, multi);

  multi.set(SERVICE_KEY_SUFIX + ':' + id, JSON.stringify(service));

  multi.exec(function (err) {
    callback(err, id);
  });
};

/**
 * Update service
 * @param service
 * @param callback
 */

StorageRedis.prototype.updateService = function (service, callback) {
  var self = this;
  var multi = this.redis.multi();
  multi.set(SERVICE_KEY_SUFIX + ':' + service.id, JSON.stringify(service));

  handleTags(service, multi);

  multi.exec(function (err) {
    if (err) {
      return callback(err);
    }
    self.getService(service.id, callback);
  });
};

/**
 * Get service
 * @param id
 * @param callback
 */

StorageRedis.prototype.getService = function (id, callback) {
  this.redis.get(SERVICE_KEY_SUFIX + ':' + id, function (err, data) {
    callback(err, (!err && data) ? JSON.parse(data) : null);
  });
};

/**
 * Delete service
 * @param id
 * @param callback
 */

StorageRedis.prototype.deleteService = function (id, callback) {
  var multi = this.redis.multi();
  // delete service
  multi.del(SERVICE_KEY_SUFIX + ':' + id);
  multi.srem(SERVICES_KEY_SUFIX, id);

  // delete reporting data
  multi.del(id + ':' + CURRENT_OUTAGE_KEY_SUFIX);
  multi.del(id + ':' + OUTAGES_KEY_SUFIX);
  multi.del(id + ':' + LATENCY_KEY_SUFIX);
  multi.del(id + ':' + FAILURE_COUNT_SUFIX);
  multi.exec(callback);
};

/**
 * Reset service data
 * @param id
 * @param callback
 */

StorageRedis.prototype.resetService = function (id, callback) {
  var multi = this.redis.multi();
  multi.del(id + ':' + CURRENT_OUTAGE_KEY_SUFIX);
  multi.del(id + ':' + OUTAGES_KEY_SUFIX);
  multi.del(id + ':' + LATENCY_KEY_SUFIX);
  multi.del(id + ':' + FAILURE_COUNT_SUFIX);
  multi.exec(callback);
};

/**
 * Get all services
 * @param options
 * @param callback
 */

StorageRedis.prototype.getServices = function (options, callback) {
  var self = this;
  this.redis.smembers(SERVICES_KEY_SUFIX, function (err, ids) {
    if (err) {
      return callback(err);
    }

    function filterByTag(service) {
        if (!options.tags || !options.tags.length) return true;

        if (!(options.tags instanceof Array)) {
          return service.tags.indexOf(options.tags) >= 0;
        }
        for (var i = 0; i < service.tags.length; i++) {
          if (options.tags.indexOf(service.tags[i]) >= 0) return true;
        }
        return false;
    }

    var multi = self.redis.multi();
    for (var i = 0; i < ids.length; i++) {
      multi.get(SERVICE_KEY_SUFIX + ':' + ids[i]);
    }
    multi.exec(function (err, services) {
      callback(err, services.map(function (service) {
        return JSON.parse(service);
      }).filter(filterByTag));
    });
  });
};


/**
 * Returns current outage if any for a certain service
 * @param service
 * @param callback
 */

StorageRedis.prototype.getCurrentOutage = function (service, callback) {
  this.redis.get(service.id + ':' + CURRENT_OUTAGE_KEY_SUFIX, function (err, data) {
    callback(err, err ? null : JSON.parse(data));
  });
};

/**
 * Records the start of an outage
 * @param service
 * @param callback
 */

StorageRedis.prototype.startOutage = function (service, outageData, callback) {
  this.redis.set(service.id + ':' + CURRENT_OUTAGE_KEY_SUFIX, JSON.stringify(outageData), function (err) {
    callback(err);
  });
};

/**
 * If exists, ends the current outage and saves the details into the outages collection
 * @param service
 * @param callback
 */

StorageRedis.prototype.archiveCurrentOutageIfExists = function (service, callback) {
  var self = this;
  this.getCurrentOutage(service, function (err, outage) {
    if (err) {
      return callback(err);
    }

    if (outage) {
      if (!outage.timestamp) {
        return callback('missing timestamp');
      }
      outage.downtime = +new Date() - outage.timestamp;

      var multi = self.redis.multi();
      // remove current outage
      multi.del(service.id + ':' + CURRENT_OUTAGE_KEY_SUFIX);
      // add to outages ordered set
      multi.zadd(service.id + ':' + OUTAGES_KEY_SUFIX, outage.timestamp, JSON.stringify(outage));
      multi.exec(function (err) {
        callback(err, outage);
      });
    } else {
      callback();
    }
  });
};

/**
 * Get outage history for a service
 * @param service
 * @param timestamp
 * @param callback
 */

StorageRedis.prototype.getServiceOutagesSince = function (service, timestamp, callback) {
  this.redis.zrevrangebyscore(service.id + ':' + OUTAGES_KEY_SUFIX, '+inf', timestamp, function (err, data) {
    callback(err, err ? null : data.map(function (entry) {
      return JSON.parse(entry);
    }));
  });
};

/**
 * Records ping latency
 * @param service
 * @param elapsed
 * @param callback
 */

StorageRedis.prototype.saveLatency = function (service, timestamp, elapsed, callback) {
  //ZADD set_name score member
  //member should be unique, that's why it is timestamp:elapsed
  this.redis.zadd(service.id + ':' + LATENCY_KEY_SUFIX, timestamp, timestamp + ':' + elapsed, callback);
};

/**
 * Get latency since certain time
 * @param service
 * @param timestamp defaults to Infinity
 * @param callback
 */

StorageRedis.prototype.getLatencySince = function (service, timestamp, aggregatedBy, callback) {
  this.redis.zrevrangebyscore(service.id + ':' + LATENCY_KEY_SUFIX, '+inf', timestamp || '-inf', 'withscores', function (err, data) {
    if (err) {
      return callback(err);
    }

    if (!data.length) {
      if (aggregatedBy) {
        return callback(null, {list: [], mean: 0});
      }
      else {
        return callback(null, []);
      }
    }

    var parsedData = parseLatencyDataFromZset(data);
    if (aggregatedBy) {
      aggregator.aggregate(parsedData.arr, aggregatedBy, function (aggregatedData) {
        callback(null, {
          list: aggregatedData,
          mean: parsedData.mean
        });
      });
    } else {
      callback(null, parsedData);
    }
  });
};

StorageRedis.prototype.getTags = function(callback) {
    var self = this;
    this.redis.smembers(TAGS_KEY_SUFIX, function (err, tags) {
        return callback(err, tags);
    });

}

StorageRedis.prototype.resetOutageFailureCount = function (service, cb) {
  this.redis.del(service.id + ':' + FAILURE_COUNT_SUFIX, cb);
};

StorageRedis.prototype.increaseOutageFailureCount = function (service, cb) {
  this.redis.incr(service.id + ':' + FAILURE_COUNT_SUFIX, cb);
};

//available on redis
StorageRedis.prototype.flush_database = function (callback) {
  this.redis.flushdb(callback);
};

StorageRedis.prototype.quit = function () {
  this.redis.quit();
};

StorageRedis.prototype.getSessionStore = function (session, options) {
  var RedisStore = connectRedis(session);
  return new RedisStore({
    client: this.redis
  });
};


/**
 * Converts ["124", "1428222697560", "123", "1428222692345"]
 *
 * into
 *
 * [{t: 1428222697560, l: 124}, {t: 1428222692345, l: 123}]
 *
 * @param zset
 * @returns {*}
 */

function parseLatencyDataFromZset(zset) {
  var list = [];
  var currentObj;
  var accLatency = 0;
  for (var i = 0; i < zset.length; i++) {
    if (i % 2 === 0) { // odd
      var lat = zset[i];
      //backward compatibility: only split timestamp:score if found this format
      if (lat.indexOf(':') !== -1){
        lat = lat.split(':')[1];
      }
      currentObj = {l: +lat};
      if (!isNaN(lat) && lat > 0) { // valid positive numbers
        accLatency += (+lat);
      }
    } else {
      currentObj.t = +zset[i]; // timestamp
      list.push(currentObj);
    }
  }
  return {
    arr: list, // TODO: change to list
    mean: Math.round(accLatency / list.length)
  };
}
