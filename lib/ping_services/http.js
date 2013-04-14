var http = require('http');
var https = require('https');

/*---------------
 Apply validation rules to a HTTP request to determine if it is valid.
 Valid status code, expected text.
-----------------*/
function validate_http_response (service, body, res){
  if (service.expected){
    if (res.statusCode != service.expected.statuscode){
      return 'FAILED! expected status code :' + service.expected.statuscode +
        ' at ' + service.url + ' but got ' + res.statusCode;
    }
    else if (service.expected.contains && (!body ||
        (body.indexOf(service.expected.contains)==-1))){
      return 'FAILED! expected text "' + service.expected.contains +
        '" but it wasn\'t found';
    }
    else{
      return ''; //ok
    }
  }
  return ''; //nothing to check for
}


function ping (service, callback){
	// record start time
	var startTime = new Date();

	var headers = {
		'Host': service.host.host
	};

	if (service.method == 'post'){
		headers['Content-Type'] = service.content_type;
		headers['Content-Length'] = JSON.stringify(service.input_data || '').length;
	}

	var method = service.method;
	if (!service.expected || !service.expected.contains){
		method = "HEAD";
	}

	var options = {
		port: service.host.port,
		host: service.host.host,
		path: service.url,
		method: method,
		agent:false
	};

	var request;
	if(service.host.protocol === "https") {
		request = https.request(options);
		https.globalAgent.maxSockets=500;
	} else  {
		request = http.request(options);
		http.globalAgent.maxSockets=500;
	}

	var handled_callback = false;
	var error = null;

	request.setTimeout(service.timeout || 10000, function(){
		if (!handled_callback){
			handled_callback = true;
			callback('Timeout');
		}
	});

	request.addListener('error', function(connectionException){
		error = connectionException.errno || 'Error establishing connection';
		if (!handled_callback){
			handled_callback = true;
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
				handled_callback = true;
				callback(validate_http_response(service, body, response), body, response, timeDiff);
			}
		});

		response.on('error', function(e) {
			error = e.message;
		});
	});

	request.on('error', function(e) {
		if (!handled_callback){
			handled_callback = true;
			callback(e.message + '. Details :' + service.host.host + service.url);
		}
	});

	request.write(JSON.stringify(service.input_data) || '');
	request.end();
}

module.exports.ping = ping;
