var postmark = require('./notifications/email/postmark');
var events = require('events');

function WatchMen(services, storage, options){
  this.storage = storage;
  this.services = services;
  this.daemon_status = 0; //0=stopped, 1=running
  this.current_requests = 0;
}

require('util').inherits(WatchMen, events.EventEmitter);

/*---------------
 Ping service
-----------------*/
WatchMen.prototype.ping = function (params, callback){

  var self = this;

  var timestamp = params.timestamp || +new Date(); //allow timestamp injection for easy testing

  self.current_requests++; //concurrent open requests

  params.service.ping_service.ping (params.service, function(error, body, response, elapsed_time){

    self.current_requests--;

    self.storage.get_status (params.service, function (err, prev_state){
      if (err) {return callback (err);}

      function add_event(status, msg, type){
        var event = {status : status, msg: msg, timestamp: timestamp, type: type};
        state.events.push(event);
      }

      var first_run = !!!prev_state;

      prev_state = prev_state || {};
      delete prev_state.prev_state; //make sure we don't store nested state

      if (err) return callback (err);

      var state = {
        last_check: timestamp,
        elapsed_time : elapsed_time,
        timestamp : timestamp,
        events: [],
        concurrent_requests : self.current_requests,

        outages : prev_state.outages || 0,
        warnings: prev_state.warnings || 0,
        prev_state : prev_state,
        last_outage: prev_state.last_outage,
        last_warning: prev_state.last_warning,
        last_ok: prev_state.last_ok,
        down_time_acc : prev_state.down_time_acc || 0 ,
        down_timestamp : prev_state.down_timestamp,
        up_since: prev_state.up_since || timestamp,

        avg_response_time: prev_state.avg_response_time || 0,
        ok_responses_count : prev_state.ok_responses_count || 0,
        running_since: prev_state.running_since || timestamp
      };

      //-------------------------------------
      // Decide if service is down (or the response is invalid)
      //-------------------------------------
      state.error = error;

      state.status = state.error ? "error" : "success";

      //next interval depends on if the request was successfull or not
      state.next_attempt_secs = state.error ?
          params.service.failed_ping_interval : params.service.ping_interval;

      //-------------------------------------
      // Calculate uptime
      //-------------------------------------
      var running = (timestamp - state.running_since) / 1000; //seconds
      var downtime = state.down_time_acc || 0;
      if (state.down_timestamp){
        downtime += (timestamp - state.down_timestamp)/1000;
      }
      state.uptime = (Math.round((100000 * (running - downtime)) / running) / 1000) || 0;

      //-------------------------------------
      // Service is down
      //-------------------------------------
      if (state.error){
        //-------------------------------------
        // Record event and outage only if this is the first error for this service.
        //-------------------------------------
        if (prev_state.status !== "error") {
          state.up_since = null;
          state.down_timestamp = timestamp;
          state.outages = (parseInt(prev_state.outages,10) || 0) + 1; //inc outages
          state.last_outage = timestamp;

          add_event('error', state.error, 'critical');
          self.emit('service_error', params.service, state);
        }
      }
      //-------------------------------------
      // Service is up
      //-------------------------------------
      else {
        state.up_since = state.up_since || timestamp;

        state.avg_response_time = Math.round(
            (state.avg_response_time * state.ok_responses_count + elapsed_time) /
            (parseInt(state.ok_responses_count || 0, 10) + 1)
        );

        state.ok_responses_count++;

        state.last_ok = timestamp;

        //-------------------------------------
        // Response over the limit?
        //-------------------------------------
        var limit = params.service.warning_if_takes_more_than;
        if (limit && (elapsed_time > limit)){ //over the limit. warning!
          state.last_warning = timestamp;
          state.warnings = (parseInt(prev_state.warnings, 10) || 0) + 1; //inc warnings
          add_event('warning', elapsed_time + ' ms (limit: ' + limit + ' ms)', 'warning');
          self.emit('service_warning', params.service, state);
        }

        //-------------------------------------
        // If previous state was "error", emit "service is back"
        //-------------------------------------
        if (prev_state.status === "error"){ //service was down and now it is up again!
          state.down_time_last_request = Math.round((timestamp - prev_state.down_timestamp) / 1000); // in sec
          state.down_time_acc = (parseInt(state.down_time_acc,10) || 0) + state.down_time_last_request; //accumulated downtime
          state.down_timestamp = null;
          add_event('success', 'site is back! down_time: ' + state.down_time_last_request + ' seconds', 'critical');
          self.emit('service_back', params.service, state);
        }
        else { //everything ok.
          state.down_time_last_request = null;
          self.emit('service_ok', params.service, state);
         }
      }

      self.storage.update_status(params.service, state, function (err){
        callback (err, state);
      });

    });
  });
 };

/*-----------------------
 Starts the service
------------------------*/
WatchMen.prototype.start = function (){
 var self = this;
 self.daemon_status = 1;

 function launch (service){
   self.ping ({service:service}, function (err, state){
    if (err){ console.error (err); }

    if (self.daemon_status){
     setTimeout(launch, parseInt(state.next_attempt_secs, 10) * 1000, service);
    }
   });
 }

 this.services.forEach(function(service){
  if (service.enabled !== false){
   launch(service);
  }
 });

 console.log('watchmen monitor started.');
};

/*-----------------------
 Stops the service
------------------------*/
WatchMen.prototype.stop = function (){
 this.daemon_status = 0;
 console.log('stopping watchmen...');
};

module.exports = WatchMen;
