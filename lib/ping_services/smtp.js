var net = require('net');

function ping (service, callback){

	var startTime = new Date();
	var socket = net.createConnection(service.host.port, service.host.host);

	//TODO: implement logic to validate and actual SMTP server (here we are just checking that ir responds)
	socket.on("data", function (c) {
		socket.end("bye!");
	});

	socket.on("end", function () {
		var timeDiff = (new Date() - startTime);
		callback(null, null, null, timeDiff);
	});
}

module.exports.ping = ping;
