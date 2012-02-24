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

var http = require('http');
var https = require('https');
var request = require ('request');

function processRequestUsingRequestModule (url_conf, callback){
	// record start time
	var startTime = new Date();
	var headers = {
	    'Host': url_conf.host.host
	};

	if (url_conf.method == 'post'){
		headers['Content-Type'] = url_conf.content_type
		headers['Content-Length'] = JSON.stringify(url_conf.input_data || '').length
	}

	var options = {
		url : (url_conf.host.protocol || 'http') + '://' + url_conf.host.host + ':' + (url_conf.host.port || 80) + url_conf.url,
		timeout: url_conf.timeout || 10000,
		method: url_conf.method
	}
	
	if (!url_conf.expected || !url_conf.expected.contains){
		options.method = "HEAD";
	}
	
	request(options, function (error, response, body) {
		var timeDiff = (new Date() - startTime);
		if (!error) {
			callback(null, body, response, timeDiff)
		}
		else{
			callback(error, null, null, null);
		}
	})
}


function processRequestUsingHttp (url_conf, callback){
	// record start time
	var startTime = new Date();

	var headers = {
	    'Host': url_conf.host.host
	};

	if (url_conf.method == 'post'){
		headers['Content-Type'] = url_conf.content_type
		headers['Content-Length'] = JSON.stringify(url_conf.input_data || '').length
	}

	//var client = http.createClient(url_conf.host.port || 80, url_conf.host.host);
	var method = url_conf.method
	if (!url_conf.expected || !url_conf.expected.contains){
		method = "HEAD";
	}
	
	//var request = client.request(method, url_conf.url, headers);
 	var options = {
	    port: url_conf.host.port,
	    host: url_conf.host.host,
		path: url_conf.url,
		method: method,
     	agent:false
    }

	if((url_conf.host.protocol) && (url_conf.host.protocol == "https")) {
 		var request = https.request(options);
 		https.globalAgent.maxSockets=500;
 	} else  {
 		var request = http.request(options);
 		http.globalAgent.maxSockets=500;
 	}

	var handled_callback = false
	var error = null

	request.setTimeout(url_conf.timeout || 10000, function(){
		if (!handled_callback){
			handled_callback = true
			callback('Timeout');
		}
	});

	request.addListener('error', function(connectionException){
		error = connectionException.errno || 'Error establishing connection';
		if (!handled_callback){
			handled_callback = true
			callback(error);
		}
	});

	request.on('response', function(response) {
		response.setEncoding('utf-8');
		var body = '';

		response.on('data', function(chunk) {
			body += chunk;
		});

		response.on('end', function() {
			var timeDiff = (new Date() - startTime);
			if (!handled_callback){
				handled_callback = true
				callback(null, body, response, timeDiff)
			}
		});

		response.on('error', function(e) {
			error = e.message
		});
	});

	request.on('error', function(e) {
		if (!handled_callback){
			handled_callback = true
			callback(e.message + '. Details :' + url_conf.host.host + url_conf.url)
		}
	});

	request.write(JSON.stringify(url_conf.input_data) || '');
	request.end();
}

exports.processRequest = processRequestUsingHttp;
