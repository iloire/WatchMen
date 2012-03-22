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

var express = require('express');
var app = module.exports = express.createServer();
var config = require('../config')

var redis = require("redis").createClient(config.database.port, config.database.host);
redis.select (config.database.db);

var util = require('../lib/util')
var watchmen = require('../lib/watchmen')

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

function $() { return Array.prototype.slice.call(arguments).join(':') } 

function getEvents (url_conf, host, max, callback){
	var events = []
	var key = $(host.host, host.port, url_conf.url, 'events')
	redis.lrange (key, 0, max, function(err, timestamps) {
		var multi = redis.multi()
		for (i=0;i<timestamps.length;i++)	{
			key = $(host.host, host.port, url_conf.url, 'event', timestamps[i])
			multi.hgetall (key);
		}
		
		multi.exec(function(err, replies) {
			for (i=0;i<(replies.length-1);i++){
				if (!replies[i]){
					redis.lrem ($(host, port, url, 'events'), 1, timestamps[i]) //event has expired. removing from list.
				}
				else{
					events.push (replies[i]);
				}
			}
			callback (events);
		});
	});		
}

//url log detail
app.get('/log', function(req, res){
	var host = req.query ['host'], url = req.query ['url'], port = req.query['port']
	var oHost = null, oUrl=null;
	for (i=0;i<config.hosts.length;i++) {
		for (var u=0;u<config.hosts[i].urls.length;u++){
			if ((config.hosts[i].host==host) && (config.hosts[i].port==port) && (config.hosts[i].urls[u].url==url)){
				oUrl = config.hosts[i].urls[u];
				oHost = config.hosts[i];
				break;
			}
		}
	}
	
	if (oUrl && oHost){
		var logs_warning = [], logs_critical = [];
	
		getEvents (oUrl, oHost, 100, function (events){
			var key = $(oHost.host, oHost.port, oUrl.url, 'status');
			redis.hget(key, 'status', function(err, data){
				if (!err){
					for (var i=0;i<events.length;i++){
						if (data.event_type == "warning"){
							logs_warning.push (events[i])
						}
						else{
							logs_critical.push (events[i])
						}
					}
			
					if ((oUrl.enabled == false) || (oHost.enabled == false)){
						status="disabled"
					}
					else {
						status = (data==1) ? "ok": "error";
					}
					res.render('entry_logs', 
					{
						title: oHost.name + ' (' + host + ':' + port+ url + ') status history', 
						status : status, 
						logs_warning: logs_warning, 
						logs_critical: logs_critical
					}, function(err, rendered){
						res.writeHead(200, {'Content-Type': 'text/html'});
        				res.end(rendered);
					});
				}
				else
                {
					console.log (err)
					res.end ('Error (see console)')
				}
			})
		});
	}
	else
    {
		res.end ('host/url not found')
	}
});

//list of hosts and url's
app.get('/', function(req, res){
	res.render('index', {title: 'watchmen'});
});



app.get('/getdata', function(req, res){
	watchmen.get_hosts(redis, config.hosts, function (err, hosts){
		var headers = {'Content-type' : 'application/json;charset=utf8'}
		res.writeHead(200, headers)
		res.end(JSON.stringify({hosts:hosts, timestamp: util.extraTimeInfo(new Date().getTime())}));
	})
});

var port = parseInt(process.argv[2], 10) || 3000
app.listen(port);
if (app.address())
	console.log("watchmen server listening on port %d in %s mode", app.address().port, app.settings.env);
else
	console.log ('something went wrong... couldn\'t listen to port?')

process.on('SIGINT', function () {
	console.log('stopping web server.. bye!');
	redis.quit();
	process.exit(0);
});