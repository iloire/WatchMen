var http = require("http")
	,	util = require("util")

function sendEmail (message, api_key, callback){
	
	var messageStr = JSON.stringify(message)

	postmark_headers = {
		"Accept":  "application/json",
		"Content-Type":  "application/json",
		"X-Postmark-Server-Token":  api_key,
		"Content-Length " : messageStr.length
	}

	var req = http.request({
		host: "api.postmarkapp.com",
		path: "/email",
		method: "POST",
		headers: postmark_headers,
		port: 80 //ssl en 443
	}, function(res) {
		
		res.setEncoding('utf8')
		var data = ''
		
		res.on('data', function (chunk) {
			data += chunk
		})
		
		res.on('end', function() {
			try {
				//http://developer.postmarkapp.com/developer-build.html
				var json = JSON.parse(data)
				if (res.statusCode==200) { //ok
					callback(null, json)
				}
				else{ //error
					callback (json,null)
				}
			} catch(e) {
				callback(e.message, null)
			}
		})
	})
	
	req.on('error', function(e) {
		callback(e.message, null)
	})
	req.write(messageStr, 'utf8')
	req.end()
}

exports.sendEmail = sendEmail