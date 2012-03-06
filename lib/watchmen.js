/*
Watchmen, and HTTP monitor for node.js

Copyright (c) 2011 Ivan Loire (twitter: @ivanloire) www.iloire.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
var postmark= require('./postmark');
var sys = require('util');
var colors = require('colors');
var config = require ('../config');
var util = require ('./util')

function log_info (str){ sys.puts (str) }
exports.log_info = log_info

function log_ok (str){ sys.puts (str.green) }
exports.log_ok=log_ok

function log_error (str){ sys.puts (str.red) }
exports.log_error=log_error

function log_warning (str){ sys.puts (str.cyan.bold) }
exports.log_warning=log_warning

function $() { return Array.prototype.slice.call(arguments).join(':') }

var ONE_HOUR_MS = 1000 * 60 * 60
var ONE_DAY_MS = ONE_HOUR_MS * 24

var ONE_DAY_SECS = 60 * 60 * 24

var current_requests = 0

function get_hosts (redis, hosts, callback){
	var multi = redis.multi()
	for (var i=0; i<hosts.length;i++){
		for (var u=0;u<hosts[i].urls.length;u++){
			var key = $(hosts[i].host, hosts[i].port, hosts[i].urls[u].url, 'status');
			multi.hgetall (key);
		}
	}
				
	function ISODateOrEmpty (date){
		return date ? new Date(parseFloat(date)).toISOString() : "";
	}
	
	multi.exec(function(err, replies) {
		if (err){
			callback (err);
		}
		else{
			var counter=0
			for (i=0;i<hosts.length;i++) {
				//remove unused host fields
				delete hosts[i].alert_to
				for (var u=0;u<hosts[i].urls.length;u++){
					//remove unused url fields
					delete hosts[i].urls[u].expected
					delete hosts[i].urls[u].method
					
					//config 
					hosts[i].urls[u].ping_interval = hosts[i].urls[u].ping_interval || hosts[i].ping_interval 
					hosts[i].urls[u].warning_if_takes_more_than = hosts[i].urls[u].warning_if_takes_more_than || hosts[i].warning_if_takes_more_than || 0
					
					//reset fields
					hosts[i].urls[u].lastfailure = hosts[i].urls[u].lastfailuretime = null;
					hosts[i].urls[u].lastok = hosts[i].urls[u].lastoktime = null;
					hosts[i].urls[u].lastwarning = hosts[i].urls[u].lastwarningtime = null;
					
					hosts[i].urls[u].avg_response_time = null;
					hosts[i].urls[u].status = "disabled";
					
					var status = replies[counter];
					if (status && status.status){
						//last failure
						if (status.lasterror){
							hosts[i].urls[u].lastfailure = ISODateOrEmpty(status.lasterror);
							hosts[i].urls[u].lastfailuretime = util.extraTimeInfo(status.lasterror)
						}
						if (status.lastok){
							hosts[i].urls[u].lastok = ISODateOrEmpty(status.lastok);
							hosts[i].urls[u].lastoktime = util.extraTimeInfo(status.lastok)
						}
						if (status.lastwarning){
							hosts[i].urls[u].lastwarning = ISODateOrEmpty(status.lastwarning);
							hosts[i].urls[u].lastwarningtime = util.extraTimeInfo(status.lastwarning)
						}
						//avg response
						hosts[i].urls[u].avg_response_time = Math.round(status.avg_response_time) || "-";
						
						if (!(hosts[i].urls[u].enabled==false || hosts[i].enabled==false))
							hosts[i].urls[u].status = (status.status==0) ? "error" : "ok" ; //will show green while collecting data
					}
					counter++;
				}
			}
			callback(null, hosts)
		}
	});	
}
exports.get_hosts=get_hosts

function log_general_error (redis, url_conf, msg, callback) {
	var timestamp = new Date().getTime();
	var expiration = ONE_DAY_SECS * 30; //in seconds
	multi.lpush('errors', timestamp.toISOString() + ":" + msg, function(err, data){
		callback(err)
	}); 
}

function createEvent(redis, url_conf, request_status, event_type, timestamp, expiration, callback){
	var timestamp = new Date().getTime();
	var multi=redis.multi()
	multi.lpush($(url_conf.host.host, url_conf.host.port, url_conf.url, 'events'), timestamp); //prepend to list of errors
	var key = $(url_conf.host.host, url_conf.host.port, url_conf.url, 'event', timestamp);
	multi.hmset(key,
					'timestamp', timestamp, 
					'event_type', event_type, 
					'msg', request_status.msg || request_status.warning || request_status.error || "-"
					); 
	multi.expire (key, expiration);
	
	multi.exec(function(err, replies) {
		callback(err);
	});
}

function record_warning (redis, url_conf, request_status, callback){
	var timestamp = new Date().getTime();
	var expiration = ONE_DAY_SECS * 10; //in seconds
	var key = $(url_conf.host.host, url_conf.host.port, url_conf.url, 'status');	
	redis.hmset(key,
		'status', 1,
		'lastwarning', timestamp, 
		function (err, data){
			if (!err)
				createEvent(redis, url_conf, request_status, 'warnings', timestamp, expiration, callback)
		}
	);	
}

function record_failure (redis, url_conf, request_status, callback){
	var timestamp = new Date().getTime();
	var expiration = ONE_DAY_SECS * 30; //in seconds
	redis.hmset($(url_conf.host.host, url_conf.host.port, url_conf.url, 'status'), 
		'status', 0,
		'down_timestamp', timestamp,
		'lasterror', timestamp,
		function (err,data){
			if (!err)
				createEvent(redis, url_conf, request_status, 'error', timestamp, expiration, callback)
		}
	); 
}

function record_success (redis, url_conf, request_status, callback){
	var timestamp = new Date().getTime();
	var expiration = ONE_DAY_SECS * 2; //in seconds
	var key = $(url_conf.host.host, url_conf.host.port, url_conf.url, 'status');
	redis.hgetall (key, function (err, status_data){
		var avg_response_time = 0;
		if (status_data){
			avg_response_time = ((status_data.avg_response_time || 0) * (status_data.responses_count || 0) 
				+ request_status.elapsed_time) / (parseInt(status_data.responses_count || 0) + 1);
		}
		else{
			avg_response_time = request_status.elapsed_time;
		}
		redis.hmset(key,
			'status', 1,
			'avg_response_time', avg_response_time,
			'lastok', timestamp, 
			function (err, data){
				redis.hincrby(key, 'responses_count',1, function (err, responses_count){
					if (!err){
						if (request_status.msg){
							createEvent(redis, url_conf, request_status, 'ok', timestamp, expiration, callback)
						}
						else
							callback(null);
					}
					else{
						callback(err);
					}
				});
			}
		);
	});	
}

function sendEmail (to_list, subject, body, callback){
	postmark.sendEmail(
	{
		'From' : config.notifications.postmark.From,
		'To': to_list.join(','),
		'Subject': subject,
		'TextBody': body }, config.notifications.postmark.Api_key, function(err, data) {

		if (err) {
			callback (err, null);
		} else {
			callback (null,'Email sent successfully to ' + to_list.join(','))
		}
	})
}

function get_url_status (url_conf, redis, callback) {
	redis.hgetall ($(url_conf.host.host, url_conf.host.port, url_conf.url, 'status'), callback);
}

function query_url(url_conf, redis, request, config, callback){
	var host_conf = url_conf.host
	var url_info = host_conf.name + ' - ' + host_conf.host + ':'+ host_conf.port  + url_conf.url + ' [' + url_conf.method + ']'
	var request_status = {}
	var error = null
	current_requests++;
	request (url_conf, function(request_err, body, response, elapsed_time){
		current_requests--;
		console.log ('concurrent requests:' + current_requests);
		request_status.elapsed_time = elapsed_time
		get_url_status (url_conf, redis, function (err, status_data){
			if (!request_err){ //request completed successfully
				if (url_conf.expected){
					if (response.statusCode != url_conf.expected.statuscode){
						error = 'FAILED! expected status code :' + url_conf.expected.statuscode + ' at ' 
							+ url_conf.url + ' but got ' + response.statusCode
					}
					else if (url_conf.expected.contains && (!body || (body.indexOf(url_conf.expected.contains)==-1))){
						error = 'FAILED! expected text "' + url_conf.expected.contains + '" but it wasn\'t found'
					}
				}
			}
			else {
				error = 'Connection error when processing request: ' + request_err
			}

			if (error){ //site down
				request_status.next_attempt_secs = url_conf.failed_ping_interval || url_conf.host.failed_ping_interval || 70;
				var info = url_info + ' down!. Error: ' + error + '. Retrying in ' + request_status.next_attempt_secs / 60 + ' minute(s)..';
				log_error (info); 
				if ((status_data==null) || (status_data.status == 1 )){ //site down (first failure)
					if (config.notifications.Enabled){
						sendEmail(
							url_conf.alert_to || host_conf.alert_to || config.notifications.To,
							url_info + ' is down!', url_info + ' is down!. Reason: ' + error, function (err, data){
								if (err){
									log_general_error (redis, url_conf, 'Error sending email: ' + JSON.stringify(err)) 
								}
							});
					}
					else{
						log_info ('Notification disabled or not triggered this time');
					}
				}
				request_status.status=0
				request_status.msg = error
				record_failure (redis, url_conf, request_status, function (err){
					callback (err, request_status);
				})	
			}
			else { 
				//service up. 
				var warning = null;
				
				request_status.status=1
				request_status.next_attempt_secs = url_conf.ping_interval || url_conf.host.ping_interval;

				//check for response time. warning?
				var limit = url_conf.warning_if_takes_more_than || host_conf.warning_if_takes_more_than;
				if (limit){
					if (request_status.elapsed_time > (limit)){
						warning = 'Request for ' + url_info + ' took too much: ' + request_status.elapsed_time + ' milliseconds. Limit=' + limit + ' milliseconds'
					}
				} 
				
				//service was down and now it is up again!
				if ((status_data != null) && (status_data.status == 0)){
					var down_time = Math.round((Date.now() - status_data.down_timestamp) / 1000);
					var info = url_info + ' is back!. Downtime: ' + down_time + ' seconds';
					if (config.notifications.Enabled){
						sendEmail(
							url_conf.alert_to || host_conf.alert_to || config.notifications.To,
							url_info + ' is back up!', info, function(err, data){
								if (err){
									log_general_error (redis, url_conf, 'Error sending email: ' + JSON.stringify(err)) 
								}
							});
					}
					request_status.msg = info;
				}

				//service is ok. log warning if that's the case
				log_ok (url_info + ' responded OK! (' + elapsed_time + ' milliseconds), body length:' + (body ? body.length : 0))
				record_success (redis, url_conf, request_status, function(err){
					if (warning){
						request_status.msg = warning;
						record_warning (redis, url_conf, request_status, function (err){
							callback (err, request_status);
						});
					}
					else
						callback (err, request_status);
				});	
			}
		});
	})
}
exports.query_url = query_url

function processUrl (url_conf, redis){
	var request = require ('./request');
	query_url(url_conf, redis, request.processRequest, config, function (err, request_status) {
		if (err)
			console.log (err)
		setTimeout (processUrl, request_status.next_attempt_secs * 1000, url_conf, redis);	
	})
}
exports.processUrl = processUrl