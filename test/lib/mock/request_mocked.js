module.exports.mocked_response = {};

module.exports.ping = function (service, callback) {
	var res = exports.mocked_response;
	callback(res.error, res.body, res.response, res.timeDiff);
};
