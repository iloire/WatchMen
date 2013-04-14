var postmark = require ('./postmark');
var config = require ('../../../config/general');

exports.sendEmail = function (to_list, subject, body, callback){
	postmark.sendEmail({
		'From' : config.notifications.postmark.from,
		'To': to_list.join(','),
		'Subject': subject,
		'TextBody': body }, config.notifications.postmark.api_key, function(err, data) {
			if (err) {
				console.error (err);
				if (callback) callback (err, null);
			} else {
				if (callback) callback (null,'Email sent successfully to ' + to_list.join(','));
			}
	});
};
